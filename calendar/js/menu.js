import { db, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc } from './firebase.js';

// Получаем элементы меню
const menuIcon = document.getElementById('menu-icon');
const sideMenu = document.getElementById('side-menu');

// Обработчик клика по иконке меню
menuIcon.addEventListener('click', () => {
    sideMenu.classList.toggle('open'); // Открываем/закрываем меню
});

// Обработчик клика за пределами меню
document.addEventListener('click', (event) => {
    if (!sideMenu.contains(event.target) && !menuIcon.contains(event.target)) {
        sideMenu.classList.remove('open'); // Закрываем меню, если клик вне его
    }
});

// Обработчик для кнопки "Заметки"

document.addEventListener('DOMContentLoaded', function () {
    const notesButton = document.getElementById('notes-button');
    const bottomSheet = document.getElementById('bottom-sheet');
    const closeSheetButton = document.getElementById('close-sheet');
    const overlay = document.getElementById('overlay');
    const sheetContent = document.getElementById('sheet-content');

    // Открытие выезжающего окна
    notesButton.addEventListener('click', function () {
        // Загружаем контент из notes/index.html

        bottomSheet.classList.add('open'); // Открываем окно
        overlay.classList.add('active'); // Показываем оверлей

    });

    // Закрытие выезжающего окна
    closeSheetButton.addEventListener('click', function () {
        bottomSheet.classList.remove('open');
        overlay.classList.remove('active');
    });

    // Закрытие при клике на оверлей
    overlay.addEventListener('click', function () {
        bottomSheet.classList.remove('open');
        overlay.classList.remove('active');
    });
});

/*const notesButton = document.getElementById('notes-button');
notesButton.addEventListener('click', () => {
    window.location.href = './notes'; // Перенаправляем на страницу ./notes
    sideMenu.classList.remove('open'); // Закрываем меню после перехода
});*/

// Обработчик для кнопки "Перейти в семейный"
const familyButton = document.getElementById('family-button');
familyButton.addEventListener('click', async () => {
    const telegramId = Telegram.WebApp.initDataUnsafe.user?.id;

    if (!telegramId) {
        alert('Ошибка: не удалось получить ID пользователя.');
        return;
    }

    const familyId = `${telegramId}_Family`;

    try {
        // Получаем документ календаря пользователя
        const calendarDocRef = doc(db, 'calendars', `${telegramId}_Base`);
        const calendarDoc = await getDoc(calendarDocRef);

        if (!calendarDoc.exists()) {
            alert('Ошибка: календарь пользователя не найден.');
            return;
        }

        const calendarData = calendarDoc.data();

        // Проверяем, находится ли пользователь уже в семейном календаре
        if (calendarData.is_family_member) {
            // Если пользователь уже в семейном календаре, отправляем сообщение с ссылкой
            const deepLink = `https://t.me/wf_assist_bot?start=connect_familyId_${familyId}`;
            const botToken = '8172498573:AAFCSMvwHU7p9SCpBR0Ea-OpinV78AjkMVk'; // Замените на токен вашего бота
            const messageText = `Вы уже в семейном календаре. Ссылка для подключения других пользователей: ${deepLink}`;

            const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: telegramId,
                    text: messageText,
                }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при отправке сообщения через бота.');
            }

            alert('Вы уже в семейном календаре. Ссылка для подключения других пользователей отправлена в ваш бот.');
            sideMenu.classList.remove('open');
            return;
        }

        // Если пользователь не в семейном календаре, продолжаем процесс
        // Обновляем документ календаря, добавляя family_calendar
        await updateDoc(calendarDocRef, {
            is_family_member: true,
            family_calendar: familyId, // Добавляем ключ family_calendar
        });

        // Создаем семейный календарь
        await setDoc(doc(db, 'family_calendars', familyId), {
            family_id: familyId,
            members: [telegramId],
        });

        // Уведомляем пользователя
        alert('Ваш календарь теперь в категории "Семейный". Информация для подключения отправлена в ваш бот.');

        // Генерируем ссылку с командой /start и параметрами
        const deepLink = `https://t.me/wf_assist_bot?start=connect_familyId_${familyId}`;

        // Отправляем сообщение через Telegram Bot API
        const botToken = '8172498573:AAFCSMvwHU7p9SCpBR0Ea-OpinV78AjkMVk'; // Замените на токен вашего бота
        const messageText = `Ваш календарь теперь в категории "Семейный". Чтобы подключить другого участника, перейдите по ссылке: ${deepLink}`;

        const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: telegramId,
                text: messageText,
            }),
        });

        if (!response.ok) {
            throw new Error('Ошибка при отправке сообщения через бота.');
        }
    } catch (error) {
        console.error('Ошибка при создании семейного календаря:', error);
        alert('Произошла ошибка при создании семейного календаря.');
    }

    sideMenu.classList.remove('open');
});

// Обработчик для кнопки "Перейти в бизнес"
const businessButton = document.getElementById('bussines-button');
businessButton.addEventListener('click', async () => {
    const telegramId = Telegram.WebApp.initDataUnsafe.user?.id; // Используем динамический ID

    if (!telegramId) {
        alert('Ошибка: не удалось получить ID пользователя.');
        return;
    }

    const businessId = `${telegramId}_Business`;

    try {
        // Получаем документ календаря пользователя
        const calendarDocRef = doc(db, 'calendars', `${telegramId}_Base`);
        const calendarDoc = await getDoc(calendarDocRef);

        if (!calendarDoc.exists()) {
            alert('Ошибка: календарь пользователя не найден.');
            return;
        }

        const calendarData = calendarDoc.data();

        // Проверяем, находится ли пользователь уже в бизнесе
        if (calendarData.is_business_member) {
            alert('Вы уже в бизнес аккаунте.');
        } else {
            // Если пользователь не в бизнесе, обновляем документ календаря
            await updateDoc(calendarDocRef, {
                is_business_member: true,
                business_calendar: businessId, // Добавляем ключ business_calendar
            });

            // Создаем бизнес календарь
            await setDoc(doc(db, 'business_calendars', businessId), {
                business_id: businessId,
                members: [telegramId],
            });

            alert('Ваш календарь теперь в категории "Бизнес".');
        }

        // Генерируем ссылку для бизнеса
        const deepLink = `https://t.me/wf_assist_bot?start=open_business_${businessId}`;

        // Отправляем сообщение через Telegram Bot API с HTML-разметкой
        const botToken = '8172498573:AAFCSMvwHU7p9SCpBR0Ea-OpinV78AjkMVk'; // Замените на токен вашего бота
        const messageText = `Ваш аккаунт теперь в категории "Бизнес". Настройте свой профиль или поделитесь ссылкой для подключения: <a href="${deepLink}" id="copy-link">${deepLink}</a>`;

        const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: telegramId,
                text: messageText,
                parse_mode: 'HTML', // Разрешаем HTML-разметку
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Business Setup',
                                web_app: { url: `https://assistbottg.ru/telegram-mini-app.v1.1.2.3/main_page/business?businessId=${businessId}` }, // Переход на страницу anketa с businessId
                            },
                        ],
                    ],
                },
            }),
        });

        // Логируем ответ от Telegram API
        const responseData = await response.json();
        console.log('Telegram API Response:', responseData);

        if (!response.ok) {
            throw new Error(`Ошибка при отправке сообщения через бота: ${responseData.description || 'Неизвестная ошибка'}`);
        }

        // Обработчик для копирования ссылки при клике на неё
        const copyLinkElement = document.getElementById('copy-link');
        if (copyLinkElement) {
            copyLinkElement.addEventListener('click', (event) => {
                event.preventDefault(); // Отменяем стандартное поведение ссылки
                navigator.clipboard.writeText(deepLink).then(() => {
                    alert('Ссылка скопирована!');
                }).catch(err => {
                    console.error('Ошибка при копировании ссылки:', err);
                });
            });
        }

    } catch (error) {
        console.error('Ошибка при создании бизнес календаря:', error);
        alert(`Произошла ошибка: ${error.message}`);
    }

    sideMenu.classList.remove('open');
});