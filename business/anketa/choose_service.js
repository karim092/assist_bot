import { db, doc, getDoc } from './firebase.js';

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем mini app на весь экран

// Получаем business_id из URL
const urlParams = new URLSearchParams(window.location.search);
const businessId = urlParams.get('business_id');

if (!businessId) {
    alert('Ошибка: не удалось получить ID бизнеса.');
    throw new Error('Business ID не найден.');
}

// Функция для загрузки списка услуг
async function loadServices() {
    try {
        // Получаем документ из Firestore
        const docRef = doc(db, 'business_questionnaire', businessId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const services = data.services; // Получаем map услуг

            const servicesList = document.getElementById('services-list');

            // Очищаем список перед загрузкой
            servicesList.innerHTML = '';

            // Перебираем услуги и добавляем их в список
            for (const [serviceId, serviceData] of Object.entries(services)) {
                const serviceDiv = document.createElement('div');
                serviceDiv.className = 'form-group';

                const label = document.createElement('label');
                label.innerHTML = `
                    <input type="radio" name="service" value="${serviceId}" required>
                    ${serviceData.name} (${serviceData.duration}, ${serviceData.price} руб.)
                `;

                serviceDiv.appendChild(label);
                servicesList.appendChild(serviceDiv);
            }
        } else {
            alert('Данные о бизнесе не найдены.');
        }
    } catch (error) {
        console.error('Ошибка при загрузке услуг:', error);
        alert('Произошла ошибка при загрузке услуг.');
    }
}

// Обработчик отправки формы
const form = document.getElementById('service-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Получаем выбранную услугу
    const selectedService = document.querySelector('input[name="service"]:checked').value;

    // Переходим на страницу выбора даты, передавая business_id и service_id
    window.location.href = `choose_date.html?business_id=${businessId}&service_id=${selectedService}`;
});

// Загружаем услуги при загрузке страницы
loadServices();