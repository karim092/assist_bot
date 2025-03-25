import { db, doc, updateDoc, getDoc } from './firebase.js';

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем mini app на весь экран

// Получаем telegram_id из URL
const urlParams = new URLSearchParams(window.location.search);
const telegramId = urlParams.get('telegram_id');

if (!telegramId) {
    alert('Ошибка: не удалось получить ID пользователя.');
    throw new Error('Telegram ID не найден.');
}

// Функция для загрузки данных из Firestore
async function loadServicesData() {
    try {
        const docRef = doc(db, 'business_questionnaire', `${telegramId}_Business`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // Заполняем поля формы, если данные есть
            if (data.services) {
                const servicesContainer = document.getElementById('services-container');
                servicesContainer.innerHTML = ''; // Очищаем контейнер

                Object.keys(data.services).forEach((key, index) => {
                    const service = data.services[key];
                    addServiceField(service.name, service.price, service.duration, index + 1);
                });
            }

            // Заполняем интервал между услугами и перерыв, если они есть
            if (data.interval_between_services) {
                document.getElementById('interval-between-services').value = data.interval_between_services;
            }
            if (data.break_time) {
                document.getElementById('break-start').value = data.break_time.start;
                document.getElementById('break-end').value = data.break_time.end;
            }
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Функция для добавления нового поля услуги
function addServiceField(name = '', price = '', duration = '', index) {
    const servicesContainer = document.getElementById('services-container');

    const serviceItem = document.createElement('div');
    serviceItem.classList.add('form-group', 'service-item');

    serviceItem.innerHTML = `
        <label for="service${index}">Услуга ${index}:</label>
        <input type="text" id="service${index}" placeholder="Название услуги" value="${name}">
        <input type="number" id="price${index}" placeholder="Стоимость" value="${price}">
        <label for="duration${index}">Продолжительность:</label>
        <input type="time" id="duration${index}" value="${duration}">
    `;

    servicesContainer.appendChild(serviceItem);
}

// Обработчик для кнопки "Добавить услугу"
document.getElementById('add-service').addEventListener('click', () => {
    const servicesContainer = document.getElementById('services-container');
    const serviceCount = servicesContainer.querySelectorAll('.service-item').length + 1;
    addServiceField('', '', '', serviceCount);
});

// Загружаем данные при открытии страницы
loadServicesData();

// Обработчик отправки формы
const form = document.getElementById('services-form');
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Собираем данные о видах услуг
    const servicesData = {};
    const serviceItems = document.querySelectorAll('.service-item');

    serviceItems.forEach((item, index) => {
        const serviceName = item.querySelector(`#service${index + 1}`).value;
        const servicePrice = item.querySelector(`#price${index + 1}`).value;
        const serviceDuration = item.querySelector(`#duration${index + 1}`).value;

        if (serviceName && servicePrice && serviceDuration) {
            servicesData[`service${index + 1}`] = {
                name: serviceName,
                price: servicePrice,
                duration: serviceDuration, // Сохраняем продолжительность в формате времени
            };
        }
    });

    // Собираем данные о интервале между услугами и перерыве
    const intervalBetweenServices = document.getElementById('interval-between-services').value;
    const breakStart = document.getElementById('break-start').value;
    const breakEnd = document.getElementById('break-end').value;

    const businessData = {
        services: servicesData,
        interval_between_services: intervalBetweenServices || null, // Интервал между услугами
        break_time: breakStart && breakEnd ? { start: breakStart, end: breakEnd } : null, // Перерыв
    };

    try {
        // Обновляем документ в Firestore
        const docRef = doc(db, 'business_questionnaire', `${telegramId}_Business`);
        await updateDoc(docRef, businessData);

        // Переходим на следующую страницу
        window.location.href = `business_schedule.html?telegram_id=${telegramId}`;
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
        alert('Произошла ошибка при сохранении данных.');
    }
});