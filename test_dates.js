
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/es');

dayjs.extend(relativeTime);
dayjs.locale('es');

console.log("Current time:", dayjs().format());

const today = dayjs().startOf('day');
console.log("Today (Start of day):", today.format());

function check(label, daysToAdd) {
    const targetDate = dayjs().add(daysToAdd, 'day');
    const expirationDate = targetDate.startOf('day');
    const diffDays = expirationDate.diff(today, 'day');

    // Mimic the UI logic
    let statusText;
    let status;
    const finPlan = targetDate;

    if (diffDays === 0) status = 'Vence hoy';
    else if (diffDays <= 7) status = 'Próximo a Vencer';
    else status = 'Activo';

    if (status === 'Vencido') {
        statusText = 'Venció ' + dayjs(finPlan).fromNow();
    } else if (status === 'Vence hoy') {
        statusText = 'Vence hoy';
    } else {
        statusText = 'Vence ' + dayjs(finPlan).endOf('day').fromNow();
    }

    console.log(`\n--- ${label} ---`);
    console.log(`Target Date: ${targetDate.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`Expiration Date (startOf day): ${expirationDate.format()}`);
    console.log(`Diff Days: ${diffDays}`);
    console.log(`UI Status: ${status}`);
    console.log(`UI Text: ${statusText}`);
    console.log(`Passes diffDays <= 1? ${diffDays <= 1}`);
    console.log(`Passes diffDays <= 2? ${diffDays <= 2}`);
}

check("Today", 0);
check("Tomorrow", 1);
check("Day After Tomorrow", 2);
check("3 Days Later", 3);
