const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldHandleArchive = `
            const handleArchiveAction = async (id) => {
                const sale = allSales.find(s => s.id === id);
                if (!sale) return;

                try {
                    // Update sale first so dynamic calculation works
                    await updateDoc(doc(db, "sales", id), { estado: 'ARCHIVADO' });

                    // Release profile if it exists
                    if (sale.accountId && sale.profileId) {
                        // Temporarily update sale locally for occupancy calculation
                        const localSaleIndex = allSales.findIndex(s => s.id === id);
                        if(localSaleIndex > -1) allSales[localSaleIndex].estado = 'ARCHIVADO';

                        const occupancy = getProfileOccupancy(sale.accountId, sale.profileId);

                        const account = allPlatformAccounts.find(a => a.id === sale.accountId);
                        if (account && account.platform !== 'Canva') {
                            const profileRef = doc(db, "platformAccounts", sale.accountId, "Perfiles", sale.profileId);
                            const updateData = { estado: 'Disponible' };
                            if(occupancy.count === 0) {
                                updateData.fechaVencimiento = null;
                                updateData.clienteId = null;
                            }
                            await updateDoc(profileRef, updateData);

                            // Update local state for immediate feedback
                            if (account.profiles) {
                                const profile = account.profiles.find(p => p.id === sale.profileId);
                                if (profile) {
                                    profile.estado = 'Disponible';
                                }
                            }
                            renderPlatformAccounts();
                        }
                    }

                    hideArchiveDeleteModal();
                } catch (e) {
                    console.error("Error archiving sale: ", e);
                    alert('Error al archivar la venta.');
                }
            };
`;

const newHandleArchive = `
            const handleArchiveAction = async (id) => {
                const sale = allSales.find(s => s.id === id);
                if (!sale) return;

                try {
                    // Variables for PIN Change logic
                    let needsPinChange = false;
                    let oldPin = null;
                    let newPin = null;
                    let isShared = false;
                    let accountData = null;
                    let profileData = null;

                    // Update sale first so dynamic calculation works
                    await updateDoc(doc(db, "sales", id), { estado: 'ARCHIVADO' });

                    // Release profile if it exists
                    if (sale.accountId && sale.profileId) {
                        // Temporarily update sale locally for occupancy calculation
                        const localSaleIndex = allSales.findIndex(s => s.id === id);
                        if(localSaleIndex > -1) allSales[localSaleIndex].estado = 'ARCHIVADO';

                        const occupancy = getProfileOccupancy(sale.accountId, sale.profileId);

                        const account = allPlatformAccounts.find(a => a.id === sale.accountId);
                        if (account && account.platform !== 'Canva') {
                            accountData = account;
                            profileData = account.profiles.find(p => p.id === sale.profileId);

                            needsPinChange = true;
                            oldPin = profileData ? profileData.pin : sale.pin;
                            newPin = generateNewPin(account.platform);
                            isShared = occupancy.count > 0; // If there are still active sales on this profile, it's shared

                            const profileRef = doc(db, "platformAccounts", sale.accountId, "Perfiles", sale.profileId);
                            const updateData = { estado: 'Disponible', pin: newPin };
                            if(occupancy.count === 0) {
                                updateData.fechaVencimiento = null;
                                updateData.clienteId = null;
                            } else {
                                updateData.estado = 'Ocupado'; // Keep occupied if shared
                            }
                            await updateDoc(profileRef, updateData);

                            // If shared, update the other sales' pin
                            if (isShared) {
                                for (const otherSale of occupancy.sales) {
                                    if (otherSale.id !== id) {
                                        await updateDoc(doc(db, "sales", otherSale.id), { pin: newPin });
                                        // Update local state
                                        const otherSaleLocal = allSales.find(s => s.id === otherSale.id);
                                        if (otherSaleLocal) otherSaleLocal.pin = newPin;
                                    }
                                }
                            }

                            // Update local state for immediate feedback
                            if (account.profiles) {
                                const profile = account.profiles.find(p => p.id === sale.profileId);
                                if (profile) {
                                    profile.estado = updateData.estado;
                                    profile.pin = newPin;
                                }
                            }
                            renderPlatformAccounts();
                        }
                    }

                    hideArchiveDeleteModal();

                    if (needsPinChange) {
                        showPinChangeAlertModal(sale, profileData, accountData, oldPin, newPin, isShared);
                    }

                } catch (e) {
                    console.error("Error archiving sale: ", e);
                    alert('Error al archivar la venta.');
                }
            };
`;

// It might be hard to do an exact string replace if there's minor formatting differences, let's use a regex or manual string replace if possible.
html = html.replace(/const handleArchiveAction = async \(id\) => \{[\s\S]*?hideArchiveDeleteModal\(\);\s*\} catch \(e\) \{\s*console.error\("Error archiving sale: ", e\);\s*alert\('Error al archivar la venta.'\);\s*\}\s*\};/, newHandleArchive.trim());
fs.writeFileSync('index.html', html);
