// familyCalendarService.js
import { db, collection, query, where, getDocs, addDoc } from './firebase.js'; // Импортируем Firestore методы
import { CalendarService } from './calendarService.js';

export class FamilyCalendarService {
    constructor(db) {
        this.db = db; // Сохраняем Firestore для использования в методах
    }

    async fetchFamilyEvents(userId) {
        try {
            console.log('Ищем события для пользователя с userId:', userId); // Логируем userId

            // 1. Получаем документ текущего пользователя из коллекции calendars
            const calendarsRef = collection(this.db, 'calendars'); // Используем this.db
            const q = query(calendarsRef, where('calendar_id', '==', userId + '_Base')); // Используем userId
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log('Пользователь не состоит в семейном календареx.');
                return [];
            }

            const userCalendar = querySnapshot.docs[0].data();
            if (!userCalendar.family_calendar) {
                console.log('Пользователь не состоит в семейном календаре.');
                return [];
            }

            // 2. Получаем документ семейного календаря
            const familyCalendarsRef = collection(this.db, 'family_calendars'); // Используем this.db
            const familyCalendarQuery = query(familyCalendarsRef, where('family_id', '==', userCalendar.family_calendar));
            const familyCalendarSnapshot = await getDocs(familyCalendarQuery);

            if (familyCalendarSnapshot.empty) {
                console.log('Семейный календарь не найден или не имеет участников.');
                return [];
            }

            const familyCalendar = familyCalendarSnapshot.docs[0].data();
            if (!familyCalendar.members) {
                console.log('Семейный календарь не имеет участников.');
                return [];
            }

            // 3. Формируем calendar_id для каждого участника
            const familyEvents = [];
            for (const memberId of familyCalendar.members) {
                const calendarId = `${memberId}_Base`;
                console.log('Ищем события для calendar_id:', calendarId); // Логируем calendarId

                // 4. Ищем события в коллекции calendar_events
                const eventsRef = collection(this.db, 'calendar_events'); // Используем this.db
                const eventsQuery = query(
                    eventsRef,
                    where('calendar_id', '==', calendarId),
                    where('is_family_event', '==', true)
                );

                console.log('Запрос событий:', eventsQuery); // Логируем запрос

                const eventsSnapshot = await getDocs(eventsQuery);

                if (eventsSnapshot.empty) {
                    console.log('Событий не найдено для calendar_id:', calendarId);
                } else {
                    console.log('Найдено событий:', eventsSnapshot.size);
                }

                eventsSnapshot.forEach(doc => {
                    const eventData = doc.data();
                    if (eventData.is_family_event === true) { // Проверяем, что is_family_event равно true
                        console.log('Событие:', doc.id, eventData); // Логируем событие
                        familyEvents.push(eventData);
                    }
                });
            }

            return familyEvents;
        } catch (error) {
            console.error('Ошибка при получении семейных событий:', error);
            return [];
        }
    }

    async fetchFamilyEventsForDate(userId, date) {
        const familyEvents = await this.fetchFamilyEvents(userId);
        return familyEvents.filter(event => {
            const eventDate = dayjs(event.startTime.toDate()).format('YYYY-MM-DD');
            return eventDate === date;
        });
    }

    async copyFamilyEventsToMembers(userId, event) {
        try {
            // 1. Получаем документ текущего пользователя из коллекции calendars
            const calendarsRef = collection(this.db, 'calendars');
            const q = query(calendarsRef, where('calendar_id', '==', userId + '_Base'));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log('Пользователь не состоит в семейном календаре.');
                return;
            }

            const userCalendar = querySnapshot.docs[0].data();
            if (!userCalendar.family_calendar) {
                console.log('Пользователь не состоит в семейном календаре.');
                return;
            }

            // 2. Получаем документ семейного календаря
            const familyCalendarsRef = collection(this.db, 'family_calendars');
            const familyCalendarQuery = query(familyCalendarsRef, where('family_id', '==', userCalendar.family_calendar));
            const familyCalendarSnapshot = await getDocs(familyCalendarQuery);

            if (familyCalendarSnapshot.empty) {
                console.log('Семейный календарь не найден или не имеет участников.');
                return;
            }

            const familyCalendar = familyCalendarSnapshot.docs[0].data();
            if (!familyCalendar.members) {
                console.log('Семейный календарь не имеет участников.');
                return;
            }

            // 3. Копируем событие в календари всех участников, кроме создателя
            for (const memberId of familyCalendar.members) {
                if (memberId === userId) {
                    console.log('Пропускаем создателя события:', memberId);
                    continue; // Пропускаем создателя события
                }

                const calendarId = `${memberId}_Base`;
                const eventsRef = collection(this.db, 'calendar_events');

                // Копируем событие
                await addDoc(eventsRef, {
                    ...event,
                    calendar_id: calendarId,
                    is_family_event: true,
                    creatorId: userId // Добавляем поле creatorId
                });

                console.log('Событие скопировано для участника:', memberId);
            }
        } catch (error) {
            console.error('Ошибка при копировании события:', error);
        }
    }
}