import { db, doc, getDoc, collection, query, where, getDocs, addDoc } from './firebase.js';

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем mini app на весь экран

// Получаем параметры из URL
const urlParams = new URLSearchParams(window.location.search);
const businessId = urlParams.get('business_id');
const serviceId = urlParams.get('service_id');
const selectedDate = urlParams.get('date');

if (!businessId || !serviceId || !selectedDate) {
    alert('Ошибка: не удалось получить данные о бизнесе, услуге или дате.');
    throw new Error('Данные не найдены.');
}

async function sendNotificationToOwner(chatId, message, tgId) {
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
                text: message,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Open Chat',
                                url: `tg://user?id=${tgId}`, // Ссылка для открытия чата
                            },
                        ],
                    ],
                },
            }),
        });

        if (!response.ok) {
            console.error('Ошибка при отправке уведомления:', await response.text());
        }
    } catch (error) {
        console.error('Ошибка при отправке уведомления:', error);
    }
}

async function bookAppointment(time, duration) {
    try {
        // Получаем данные о бизнесе, чтобы узнать название услуги
        const businessDocRef = doc(db, 'business_questionnaire', businessId);
        const businessDocSnap = await getDoc(businessDocRef);

        if (!businessDocSnap.exists()) {
            alert('Данные о бизнесе не найдены.');
            return;
        }

        const businessData = businessDocSnap.data();
        const serviceName = businessData.services[serviceId].name; // Название услуги

        const tgId = tg.initDataUnsafe.user?.id;

        // Извлекаем telegram_id владельца из businessId
        const ownerChatId = businessId.replace('_Business', ''); // Убираем "_Business" из businessId

        // Добавляем новую запись в коллекцию bookings
        await addDoc(collection(db, 'bookings'), {
            business_id: businessId,
            service_id: serviceId,
            date: selectedDate,
            time: time,
            duration: duration, // Продолжительность услуги берется из данных услуги
            client_id: tgId, // Здесь можно использовать ID клиента из Telegram или другой системы
        });

        // Отправляем уведомление владельцу бизнеса
        if (ownerChatId) {
            const message = `Новая запись!\n\nДата: ${selectedDate}\nВремя: ${time}\nУслуга: ${serviceName}`;
            await sendNotificationToOwner(ownerChatId, message, tgId); // Передаем tgId клиента
        }

        alert('Запись успешно создана!');
        tg.close(); // Закрываем mini app после успешной записи
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
        alert('Произошла ошибка при создании записи.');
    }
}

// Функция для загрузки данных о бизнесе и услуге
async function loadTimeSlots() {
    try {
        // Получаем данные о бизнесе
        const businessDocRef = doc(db, 'business_questionnaire', businessId);
        const businessDocSnap = await getDoc(businessDocRef);

        if (!businessDocSnap.exists()) {
            alert('Данные о бизнесе не найдены.');
            return;
        }

        const businessData = businessDocSnap.data();
        const operatingMode = businessData.operating_mode; // Режим работы
        const services = businessData.services; // Услуги
        const intervalBetweenServices = parseInt(businessData.interval_between_services) || 0; // Интервал между услугами (в минутах)
        const breakTime = businessData.break_time || null; // Перерыв

        // Получаем данные о выбранной услуге
        const selectedService = services[serviceId];
        if (!selectedService) {
            alert('Услуга не найдена.');
            return;
        }

        const serviceDuration = selectedService.duration; // Продолжительность услуги (например, "01:00")

        // Преобразуем продолжительность услуги в минуты
        const [hours, minutes] = serviceDuration.split(':');
        const durationInMinutes = parseInt(hours) * 60 + parseInt(minutes);

        // Получаем режим работы на выбранный день
        const dayOfWeek = new Date(selectedDate.split('.').reverse().join('-')).getDay(); // День недели (0 - воскресенье, 1 - понедельник и т.д.)
        const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
        const workingHours = operatingMode[dayKey]; // Время работы (например, "10:00 - 18:00")

        if (!workingHours) {
            alert('На выбранную дату бизнес не работает.');
            return;
        }

        const [startTime, endTime] = workingHours.split(' - ');

        // Получаем занятые временные окна
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('business_id', '==', businessId), where('date', '==', selectedDate));
        const querySnapshot = await getDocs(q);

        const bookedSlots = [];
        querySnapshot.forEach((doc) => {
            const booking = doc.data();
            bookedSlots.push({
                start: booking.time,
                end: addMinutes(booking.time, convertDurationToMinutes(booking.duration))
            });
        });

        // Генерируем временные окна с шагом в 15 минут
        const timeSlots = generateTimeSlots(startTime, endTime, 15); // Шаг в 15 минут

        // Фильтруем свободные окна с учетом продолжительности услуги, интервала и перерыва
        const freeSlots = timeSlots.filter(slot => {
            const slotStart = convertTimeToMinutes(slot);
            const slotEnd = slotStart + durationInMinutes;

            // Проверяем, что окно не выходит за пределы рабочего времени
            if (slotEnd > convertTimeToMinutes(endTime)) {
                return false;
            }

            // Проверяем, не пересекается ли текущее окно с занятыми
            for (const bookedSlot of bookedSlots) {
                const bookedStart = convertTimeToMinutes(bookedSlot.start);
                const bookedEnd = convertTimeToMinutes(bookedSlot.end);

                if (slotStart < bookedEnd + intervalBetweenServices && slotEnd > bookedStart) {
                    return false; // Окно занято или не хватает интервала
                }
            }

            // Проверяем, не попадает ли окно на перерыв
            if (breakTime) {
                const breakStart = convertTimeToMinutes(breakTime.start);
                const breakEnd = convertTimeToMinutes(breakTime.end);

                if (slotStart < breakEnd && slotEnd > breakStart) {
                    return false; // Окно попадает на перерыв
                }
            }

            return true; // Окно свободно
        });

        // Отображаем свободные окна
        const timeSlotsContainer = document.getElementById('time-slots');
        if (freeSlots.length === 0) {
            timeSlotsContainer.innerHTML = '<p>На выбранную дату нет свободных окон.</p>';
        } else {
            freeSlots.forEach(slot => {
                const slotButton = document.createElement('button');
                slotButton.className = 'tg-button time-slot';
                slotButton.textContent = slot;
                slotButton.addEventListener('click', () => {
                    bookAppointment(slot, serviceDuration); // Передаем время и продолжительность услуги
                });
                timeSlotsContainer.appendChild(slotButton);
            });
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        alert('Произошла ошибка при загрузке данных.');
    }
}

// Функция для генерации временных окон с шагом в минутах
function generateTimeSlots(startTime, endTime, stepInMinutes) {
    const slots = [];
    let currentTime = startTime;

    while (currentTime < endTime) {
        slots.push(currentTime);
        currentTime = addMinutes(currentTime, stepInMinutes);
    }

    return slots;
}

// Функция для добавления минут к времени
function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

// Функция для преобразования времени в минуты
function convertTimeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Функция для преобразования продолжительности в минуты
function convertDurationToMinutes(duration) {
    const [hours, minutes] = duration.split(':').map(Number);
    return hours * 60 + minutes;
}

// Загружаем временные окна при загрузке страницы
loadTimeSlots();