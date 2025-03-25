import { db, collection, addDoc, Timestamp, setDoc, doc, getDoc } from './firebase.js';
//import { CalendarService } from '../calendarService.js';



// Используем глобальную переменную
console.log(webAppUrl)

const telegramId = 1312763450;//Telegram.WebApp.initDataUnsafe.user?.id; // Замените на реальный ID пользователя
const calendarId = '1312763450_Base'//Telegram.WebApp.initDataUnsafe.user?.id + '_Base'; // Убедитесь, что это правильный формат

const sliderMenu = document.getElementById('formSliderMenu');
const inputs = document.querySelectorAll('input, textarea');
let keyboardHeight = 0;

function calculateKeyboardHeight() {
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.clientHeight;
    keyboardHeight = documentHeight - viewportHeight;
}

function moveFormUp() {
    sliderMenu.style.transform = `translateY(-${keyboardHeight}px)`;
}

function moveFormDown() {
    sliderMenu.style.transform = 'translateY(0)';
}

inputs.forEach((input) => {
    input.addEventListener('focus', moveFormUp);
    input.addEventListener('blur', moveFormDown);
});

window.addEventListener('resize', calculateKeyboardHeight);
calculateKeyboardHeight();

async function getExecutorAvatar(telegramId) {
    try {
        const botToken = '8172498573:AAFCSMvwHU7p9SCpBR0Ea-OpinV78AjkMVk';
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${telegramId}`);
        const data = await response.json();
        if (data.ok && data.result.photos.length > 0) {
            const fileId = data.result.photos[0][0].file_id;
            const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
            const fileData = await fileResponse.json();
            if (fileData.ok) {
                const avatarUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
                console.log('Avatar URL:', avatarUrl); // Отладочное сообщение
                return avatarUrl;
            }
        }
    } catch (error) {
        console.error('Ошибка при получении аватарки:', error);
    }
    return null; // Если аватарка не найдена
}

async function getTelegramUsername(telegramId) {
    const botToken = '8172498573:AAFCSMvwHU7p9SCpBR0Ea-OpinV78AjkMVk'; // Замените на токен вашего бота
    const apiUrl = `https://api.telegram.org/bot${botToken}/getChat?chat_id=${telegramId}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.ok) {
            const chat = data.result;
            return chat.username || `User ${telegramId}`; // Возвращаем username или fallback
        } else {
            console.error("Ошибка при получении данных из Telegram API:", data);
            return `User ${telegramId}`; // Fallback, если username не найден
        }
    } catch (error) {
        console.error("Ошибка при вызове Telegram API:", error);
        return `User ${telegramId}`; // Fallback, если произошла ошибка
    }
}

async function sendTelegramMessage(chatId, text, buttonText, webAppUrl) {
    const botToken = '8172498573:AAFCSMvwHU7p9SCpBR0Ea-OpinV78AjkMVk'; // Замените на токен вашего бота
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: buttonText,
                                web_app: { url: webAppUrl }, // Мини-приложение,
                            },
                        ],
                    ],
                },
            }),
        });

        const data = await response.json();
        if (data.ok) {
            console.log("Сообщение успешно отправлено:", data);
        } else {
            console.error("Ошибка при отправке сообщения:", data);
        }
    } catch (error) {
        console.error("Ошибка при вызове Telegram API:", error);
    }
}

// Ожидаем загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM загружен');

    loadExecutors(calendarId);

    // Получаем кнопку для открытия окна
    const openFormButton = document.getElementById('editEvent');
    const formSliderMenu = document.getElementById('formSliderMenu');
    const formSliderHandle = document.getElementById('formSliderHandle'); // Добавляем элемент ручки

    // Проверяем, что элементы существуют
    if (!openFormButton) {
        console.error('Элемент с id="editEvent" не найден.');
    }
    if (!formSliderMenu) {
        console.error('Элемент с id="formSliderMenu" не найден.');
    }
    if (!formSliderHandle) {
        console.error('Элемент с id="formSliderHandle" не найден.');
    }

    // Обработчик отправки формы
    const form = document.getElementById('add-event-form');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Собираем данные из формы
        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const date = document.getElementById('event-date').value;
        const startTime = document.getElementById('event-start-time').value;
        const endTime = document.getElementById('event-end-time').value;
        const executor = document.getElementById('event-executor').value;
        const isFamilyEvent = document.getElementById('is-family-event').checked;

        // Преобразуем дату и время в формат Firestore Timestamp
        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(`${date}T${endTime}`);

        // Генерируем имя документа
        const currentDate = new Date();
        const docName = `${calendarId}_${currentDate.toISOString()}`; // Используем переменную calendarId

        // Создаем объект для отправки в Firestore
        const eventData = {
            title: title,
            discription: description,
            startTime: Timestamp.fromDate(startDateTime),
            endTime: Timestamp.fromDate(endDateTime),
            executor: executor ? [executor] : [],
            is_family_event: isFamilyEvent,
            creatorId: telegramId, // Добавляем creatorId
            calendar_id: calendarId, // Добавляем calendar_id
        };

        try {
            // Отправляем данные в Firestore с указанным именем документа
            await setDoc(doc(db, "calendar_events", docName), eventData); // Используем setDoc и doc
            console.log("Событие добавлено с ID: ", docName);

        // Очищаем форму после успешной отправки
        form.reset();
        alert("Событие успешно добавлено!");

            // Если выбран исполнитель, отправляем ему сообщение
            if (executor) {
                const messageText = `Вас отметили как исполнителя события "${title}" Дата события: ${date}. Данное событие вы можете увидеть в календаре.`;
                const buttonText = "Open Calendar";
    
                await sendTelegramMessage(executor, messageText, buttonText, webAppUrl);
                console.log("Сообщение исполнителю отправлено.");
            }
        } catch (error) {
            console.error("Ошибка при добавлении события: ", error);
            alert("Произошла ошибка при добавлении события.");
        }
    });

    // Если элементы найдены, добавляем обработчики
    if (openFormButton && formSliderMenu && formSliderHandle) {
        // Обработчик нажатия на кнопку "editEvent"
        openFormButton.addEventListener('click', function () {
            console.log('Кнопка editEvent нажата!'); // Отладочный вывод
            formSliderMenu.classList.toggle('open'); // Показываем/скрываем окно
        });

        // Закрытие окна при клике на ручку
        formSliderHandle.addEventListener('click', function () {
            formSliderMenu.classList.remove('open'); // Скрываем окно
        });

        // Закрытие окна при клике вне его области
        document.addEventListener('click', function (event) {
            if (formSliderMenu && !formSliderMenu.contains(event.target) && !openFormButton.contains(event.target)) {
                formSliderMenu.classList.remove('open'); // Скрываем окно
            }
        });
    }
});

// Глобальная переменная для хранения данных об исполнителях
window.executorsData = {};

async function loadExecutors(calendarId) {
    const executorsSelect = document.getElementById('event-executor');

    try {
        // Шаг 1: Получаем документ из коллекции calendars
        const calendarDocRef = doc(db, "calendars", calendarId);
        const calendarDocSnap = await getDoc(calendarDocRef);

        if (calendarDocSnap.exists()) {
            const calendarData = calendarDocSnap.data();
            console.log("Данные календаря:", calendarData);

            // Шаг 2: Проверяем поле family_calendar
            const familyCalendarId = calendarData.family_calendar;
            if (familyCalendarId) {
                console.log("ID семейного календаря:", familyCalendarId);

                // Шаг 3: Получаем документ из коллекции family_calendars
                const familyCalendarDocRef = doc(db, "family_calendars", familyCalendarId);
                const familyCalendarDocSnap = await getDoc(familyCalendarDocRef);

                if (familyCalendarDocSnap.exists()) {
                    const familyCalendarData = familyCalendarDocSnap.data();
                    console.log("Данные семейного календаря:", familyCalendarData);

                    // Шаг 4: Получаем список members
                    let members = familyCalendarData.members || [];
                    console.log("Исходные members:", members);

                    // Если members — это массив чисел, преобразуем их в строки
                    if (Array.isArray(members)) {
                        members = members.map(member => member.toString());
                        console.log("Преобразованные members:", members);
                    } else {
                        console.error("Поле members не является массивом.");
                        return;
                    }

                    // Очищаем выпадающий список перед заполнением
                    executorsSelect.innerHTML = '<option value="" disabled selected>Исполнитель</option>';

                    // Для каждого member получаем telegram_username через Telegram API
                    for (const memberId of members) {
                        const telegramUsername = await getTelegramUsername(memberId); // Получаем username
                        const executorAvatar = await getExecutorAvatar(memberId); // Получаем аватарку
                        console.log(`Username пользователя ${memberId}:`, telegramUsername);
                        console.log(`Username пользователя ${memberId}:`, telegramUsername);
                        console.log(`Аватар пользователя ${memberId}:`, executorAvatar);
                        
                            // Сохраняем данные об исполнителе в глобальной переменной
                            window.executorsData[memberId] = {
                                username: telegramUsername,
                                avatar: executorAvatar,
                            };

                        // Сохраняем данные об исполнителях в localStorage
                        console.log('Saving executorsData to localStorage:', window.executorsData);
                        localStorage.setItem('executorsData', JSON.stringify(window.executorsData));

                        // Добавляем option в выпадающий список
                        const option = document.createElement('option');
                        option.value = memberId;
                        option.textContent = telegramUsername;
                        executorsSelect.appendChild(option);
                    }
                } else {
                    console.error("Документ family_calendars не найден.");
                }
            } else {
                console.log("Поле family_calendar пустое.");
            }
        } else {
            console.error("Документ calendars не найден.");
        }
    } catch (error) {
        console.error("Ошибка при загрузке исполнителей: ", error);
    }
}