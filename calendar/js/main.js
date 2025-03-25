// main.js
import { CalendarService } from './calendarService.js';
import { FamilyCalendarService } from './familyCalendarService.js'; // Импортируем FamilyCalendarService
import { CalendarUI } from './calendarUI.js';
import { db } from './firebase.js'; // Импортируем db из firebase.js

// main.js или другой файл, который запускается при загрузке приложения
//let tg = window.Telegram.WebApp;
//tg.requestFullscreen();

const telegramId = 1312763450;//Telegram.WebApp.initDataUnsafe.user?.id; // Замените на реальный ID пользователя
const calendarId = '1312763450_Base';//Telegram.WebApp.initDataUnsafe.user?.id + '_Base'; // Убедитесь, что это правильный формат

if (!calendarId) {
    console.error('Ошибка: calendar_id не указан в URL.');
} else {
    const calendarService = new CalendarService(calendarId);
    const familyCalendarService = new FamilyCalendarService(db); // Передаем db в FamilyCalendarService
    const calendarUI = new CalendarUI(calendarService, familyCalendarService, document.getElementById('calendar'), telegramId); // Передаем telegramId

    const calendarName = await calendarService.getCalendarNameById(calendarId);

    if (calendarName) {
        console.log('Название календаря:', calendarName);
        const calendarNameSpan = document.getElementById('header');
        if (calendarNameSpan) {
            calendarNameSpan.textContent = calendarName;
        }

        await calendarUI.renderCalendar();
        //calendarUI.renderTimeSelector(document.getElementById('time'));
    } else {
        console.log('Календарь с указанным ID не найден.');
    }
}

export { telegramId, calendarId };