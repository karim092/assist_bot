import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, serverTimestamp, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

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

// Получаем telegram_id пользователя
const telegramId = Telegram.WebApp.initDataUnsafe.user?.id;
if (!telegramId) {
    console.error("Ошибка: telegram_id не найден.");
}

// Получаем элементы DOM
const connectCalendarBtn = document.getElementById('connect-calendar-btn');
const connectSubmitCalendarBtn = document.getElementById('connect-submit-calendar-btn');
const connectCalendarForm = document.getElementById('connect-calendar-form');
const connectCalendarInput = document.getElementById('connect-calendar-name');

connectCalendarBtn.addEventListener('click', () => {
    console.log('Кнопка "Подключить календарь" нажата');
    connectCalendarForm.style.display = 'block';
    connectCalendarForm.classList.remove('form-hidden');
    connectCalendarForm.classList.add('form-visible');
});

async function getCalendarNameById(calendarId) {
    try {
        // Создаем ссылку на документ календаря
        const calendarDocRef = doc(db, 'calendars', calendarId);
        
        // Получаем документ календаря
        const calendarDoc = await getDoc(calendarDocRef);

        // Если документ существует, возвращаем имя календаря
        if (calendarDoc.exists()) {
            return calendarDoc.data().calendar_name;
        } else {
            // Если документ не найден, возвращаем null
            return null;
        }
    } catch (error) {
        console.error('Ошибка при получении имени календаря:', error);
        return null;
    }
}

// Обработчик нажатия на кнопку "Подключиться"
connectSubmitCalendarBtn.addEventListener('click', async () => {
    const connectCallendarId = connectCalendarInput.value.trim();

    if (!connectCallendarId) {
        alert('Пожалуйста, введите Id календаря.');
        return;
    }

    if (!telegramId) {
        alert('Ошибка: не удалось получить telegram_id.');
        return;
    }

    // Логируем введенный calendar_id
    console.log('Введенный calendar_id:', connectCallendarId);

    // Получаем имя календаря по calendar_id
    const calendarName = await getCalendarNameById(connectCallendarId);

    if (calendarName) {
        console.log('Calendar Name:', calendarName);

        // Сохраняем данные о подключении пользователя к календарю
        try {
            const docRef = await addDoc(collection(db, 'calendars'), {
                calendar_id: connectCallendarId,
                calendar_name: calendarName,
                telegram_id: telegramId,
                connected_at: serverTimestamp()
            });

            alert('Календарь успешно подключен!');
            console.log('ID записи о подключении:', docRef.id);
        } catch (error) {
            console.error('Ошибка при подключении к календарю:', error);
            alert('Произошла ошибка при подключении к календарю.');
        }
    } else {
        alert('Календарь с указанным ID не найден.');
    }
});
