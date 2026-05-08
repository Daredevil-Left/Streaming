const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const reportesLogic = `
        // --- Reportes View Logic ---
        const reportMonthFilter = document.getElementById('report-month-filter');
        // Set default month to current
        reportMonthFilter.value = dayjs().format('YYYY-MM');

        const renderReports = () => {
            const selectedMonthStr = reportMonthFilter.value;
            if (!selectedMonthStr) return;

            const targetMonth = dayjs(selectedMonthStr, 'YYYY-MM');
            const reportsGrid = document.getElementById('reports-grid');
            reportsGrid.innerHTML = '';

            let totalCostOverall = 0;
            let totalIncomeOverall = 0;

            // Group accounts. Combos share a comboId.
            const groups = new Map(); // key: accountId or comboId, value: { isCombo, email, platforms, cost, accountIds }

            allPlatformAccounts.forEach(acc => {
                if (acc.isCombo && acc.comboId) {
                    if (!groups.has(acc.comboId)) {
                        groups.set(acc.comboId, {
                            id: acc.comboId,
                            isCombo: true,
                            email: acc.email,
                            platforms: new Set([acc.platform]),
                            cost: acc.comboCost || 0,
                            accountIds: [acc.id]
                        });
                    } else {
                        const group = groups.get(acc.comboId);
                        group.platforms.add(acc.platform);
                        group.accountIds.push(acc.id);
                    }
                } else {
                    groups.set(acc.id, {
                        id: acc.id,
                        isCombo: false,
                        email: acc.email,
                        platforms: new Set([acc.platform]),
                        cost: acc.cost || 0,
                        accountIds: [acc.id]
                    });
                }
            });

            // Calculate income for each group for the selected month
            // We consider a sale "belongs" to a month if its \`inicioPlan\` falls in that month
            Array.from(groups.values()).forEach(group => {
                let groupIncome = 0;

                allSales.forEach(sale => {
                    if (sale.estado !== 'ARCHIVADO' && group.accountIds.includes(sale.accountId)) {
                        const saleDate = dayjs(sale.inicioPlan);
                        if (saleDate.isSame(targetMonth, 'month')) {
                            groupIncome += (sale.precio || 0);
                        }
                    }
                });

                group.income = groupIncome;
                group.balance = group.income - group.cost;

                totalCostOverall += group.cost;
                totalIncomeOverall += group.income;

                const balanceColor = group.balance >= 0 ? 'text-green-600' : 'text-red-600';
                const platformsStr = Array.from(group.platforms).join(' + ');

                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = \`
                    <td class="px-4 py-3">
                        <div class="font-medium text-gray-800">\${group.isCombo ? 'Combo' : 'Cuenta'}: \${platformsStr}</div>
                        <div class="text-xs text-gray-500">\${group.email}</div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">S/\${group.cost.toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">S/\${group.income.toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm font-bold \${balanceColor}">S/\${group.balance.toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold \${group.balance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            \${group.balance >= 0 ? 'Ganancia' : 'Pérdida'}
                        </span>
                    </td>
                \`;
                reportsGrid.appendChild(row);
            });

            if (groups.size === 0) {
                reportsGrid.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No hay cuentas registradas.</td></tr>';
            }

            const totalBalanceOverall = totalIncomeOverall - totalCostOverall;
            document.getElementById('report-total-cost').textContent = \`S/\${totalCostOverall.toFixed(2)}\`;
            document.getElementById('report-total-income').textContent = \`S/\${totalIncomeOverall.toFixed(2)}\`;
            const balanceEl = document.getElementById('report-total-balance');
            balanceEl.textContent = \`S/\${totalBalanceOverall.toFixed(2)}\`;
            balanceEl.className = \`px-4 py-3 \${totalBalanceOverall >= 0 ? 'text-green-600' : 'text-red-600'}\`;
        };

        reportMonthFilter.addEventListener('change', renderReports);
`;

const searchSaveCosts = "selectors.copyPromoBtn.addEventListener('click', copyPromo);";
content = content.replace(searchSaveCosts, searchSaveCosts + '\n' + reportesLogic);


const searchPlatformAccountsLoad = "populateAccountFilterDropdown();\n            loadDashboardData();";
const replacePlatformAccountsLoad = "populateAccountFilterDropdown();\n            loadDashboardData();\n            if (typeof renderReports === 'function') renderReports();";
content = content.replace(searchPlatformAccountsLoad, replacePlatformAccountsLoad);


const searchSalesLoad = "loadDashboardData();\n            renderRecentIncome();\n            selectors.loadingState.classList.add('hidden');";
const replaceSalesLoad = "loadDashboardData();\n            renderRecentIncome();\n            if (typeof renderReports === 'function') renderReports();\n            selectors.loadingState.classList.add('hidden');";
content = content.replace(searchSalesLoad, replaceSalesLoad);

fs.writeFileSync('index.html', content);
console.log('Patched');
