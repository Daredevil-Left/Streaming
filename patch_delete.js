const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newHandleDelete = `
            const handlePermanentDeleteAction = async (id) => {
                const sale = allSales.find(s => s.id === id);
                if (!sale) return;

                try {
                    let needsPinChange = false;
                    let oldPin = null;
                    let newPin = null;
                    let isShared = false;
                    let accountData = null;
                    let profileData = null;

                    await deleteDoc(doc(db, "sales", id));

                    // Release profile if it exists
                    if (sale.accountId && sale.profileId) {
                        // Remove from allSales locally for occupancy calc
                        allSales = allSales.filter(s => s.id !== id);
                        const occupancy = getProfileOccupancy(sale.accountId, sale.profileId);

                        const account = allPlatformAccounts.find(a => a.id === sale.accountId);
                        if (account && account.platform !== 'Canva') {
                            accountData = account;
                            profileData = account.profiles.find(p => p.id === sale.profileId);

                            needsPinChange = true;
                            oldPin = profileData ? profileData.pin : sale.pin;
                            newPin = generateNewPin(account.platform);
                            isShared = occupancy.count > 0;

                            const profileRef = doc(db, "platformAccounts", sale.accountId, "Perfiles", sale.profileId);
                            const updateData = { estado: 'Disponible', pin: newPin };
                            if(occupancy.count === 0) {
                                updateData.fechaVencimiento = null;
                                updateData.clienteId = null;
                            } else {
                                updateData.estado = 'Ocupado';
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

                            // Update local state
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
                    console.error("Error deleting sale: ", e);
                    alert('Error al eliminar la venta.');
                }
            };
`;

html = html.replace(/const handlePermanentDeleteAction = async \(id\) => \{[\s\S]*?hideArchiveDeleteModal\(\);\s*\} catch \(e\) \{\s*console.error\("Error deleting sale: ", e\);\s*alert\('Error al eliminar la venta.'\);\s*\}\s*\};/, newHandleDelete.trim());
fs.writeFileSync('index.html', html);
