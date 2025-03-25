import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBPb2LNteDn8B1ZqqeGsZFoZK6lwCr730o",
  authDomain: "assistentbot-886e7.firebaseapp.com",
  projectId: "assistentbot-886e7",
  storageBucket: "assistentbot-886e7.firebasestorage.app",
  messagingSenderId: "867234276353",
  appId: "1:867234276353:web:06038dc8caaff9a4e40c00",
  measurementId: "G-3WVQ1LNK9B"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Получаем элементы DOM
const calendarSelect = document.getElementById('main-calendar-select');
const saveMainCalendarBtn = document.getElementById('save-main-calendar-btn');

if (!calendarSelect || !saveMainCalendarBtn) {
    console.error("Ошибка: элементы DOM не найдены.");
}

// Получаем telegram_id пользователя
const telegramId = Telegram.WebApp.initDataUnsafe.user?.id;
if (!telegramId) {
    console.error("Ошибка: telegram_id не найден.");
}

// Функция для загрузки календарей
const loadCalendars = async () => {
    console.log("Загрузка календарей...");
    calendarSelect.innerHTML = '<option value="" disabled selected>Выберите календарь</option>';

    const q = query(collection(db, "calendars"), where("telegram_id", "==", telegramId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("Календари не найдены.");
        return;
    }

    querySnapshot.forEach((doc) => {
        const calendarName = doc.data().calendar_name;
        const calendarId = doc.data().calendar_id;
        console.log(`Найден календарь: ${calendarName} (ID: ${calendarId})`);

        const option = document.createElement('option');
        option.value = calendarId;
        option.textContent = calendarName;
        calendarSelect.appendChild(option);
    });

    // Принудительное обновление интерфейса
    Telegram.WebApp.ready();
};

// Загружаем календари при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    saveMainCalendarBtn.disabled = true; // Отключаем кнопку
    await loadCalendars(); // Загружаем календари
    saveMainCalendarBtn.disabled = false; // Включаем кнопку после загрузки
});

// Обработчик нажатия на кнопку "Сохранить"
saveMainCalendarBtn.addEventListener('click', async (event) => {
    event.preventDefault(); // Предотвращаем стандартное поведение кнопки

    console.log("Нажата кнопка 'Сохранить'.");

    // Добавляем небольшую задержку для обновления DOM
    await new Promise(resolve => setTimeout(resolve, 100));

   // if (calendarSelect.selectedIndex === -1) {
   //     alert("Пожалуйста, выберите календарь.");
   //     return;
   // }

    const selectedOption = calendarSelect.options[calendarSelect.selectedIndex];
    const selectedCalendarId = selectedOption.value;
    const selectedCalendarName = selectedOption.textContent;

    // Проверяем, что выбранный элемент имеет корректные значения
    if (!selectedCalendarId || !selectedCalendarName) {
        alert("Ошибка: выбранный календарь недействителен.");
        return;
    }

    console.log(`Выбран календарь: ${selectedCalendarName} (ID: ${selectedCalendarId})`);

    const telegramIdStr = String(telegramId);

    const q = query(collection(db, "basic_calendar"), where("telegram_id", "==", telegramId));
    const querySnapshot = await getDocs(q);

    console.log("Результаты запроса к Firestore:", querySnapshot.docs);

    if (querySnapshot.empty) {
        alert("Документ с таким telegram_id не найден. Сначала создайте основной календарь.");
        return;
    }

    const docRef = querySnapshot.docs[0].ref;
    console.log("Обновление документа в Firestore:", docRef);

    try {
        await setDoc(docRef, {
            calendar_id: selectedCalendarId,
            calendar_name: selectedCalendarName
        }, { merge: true });

        alert("Основной календарь успешно обновлен!");
    } catch (error) {
        console.error("Ошибка при обновлении основного календаря:", error);
        alert("Произошла ошибка при обновлении основного календаря.");
    }
});