// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем mini app на весь экран

// Получаем business_id и service_id из URL
const urlParams = new URLSearchParams(window.location.search);
const businessId = urlParams.get('business_id');
const serviceId = urlParams.get('service_id');

if (!businessId || !serviceId) {
    alert('Ошибка: не удалось получить данные о бизнесе или услуге.');
    throw new Error('Business ID или Service ID не найдены.');
}

// Инициализация Flatpickr
const datePicker = flatpickr("#date-picker", {
    locale: "ru", // Локализация на русский
    minDate: "today", // Минимальная дата — сегодня
    dateFormat: "d.m.Y", // Формат даты
    disableMobile: true, // Отключаем мобильный вид для лучшего UX
});

// Обработчик отправки формы
const form = document.getElementById('date-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Получаем выбранную дату
    const selectedDate = datePicker.selectedDates[0];

    if (!selectedDate) {
        alert('Пожалуйста, выберите дату.');
        return;
    }

    // Форматируем дату в удобный формат
    const formattedDate = flatpickr.formatDate(selectedDate, "d.m.Y");

    // Переходим на страницу выбора времени
    window.location.href = `choose_time.html?business_id=${businessId}&service_id=${serviceId}&date=${formattedDate}`;
});