import { db, collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from './firebase.js';
import 'https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js';
import 'https://cdn.jsdelivr.net/npm/dayjs@1/locale/ru.js'; // Поддержка русского языка

export class CalendarService {
    constructor(calendarId) {
        this.calendarId = calendarId;
    }

    async fetchEventsForMonth(year, month) {
        const startOfMonth = dayjs(`${year}-${month}-01`).startOf('month').toDate();
        const endOfMonth = dayjs(`${year}-${month}-01`).endOf('month').toDate();
    
        const eventsRef = collection(db, 'calendar_events');
        const q = query(
            eventsRef,
            where('calendar_id', '==', this.calendarId),
            where('startTime', '>=', startOfMonth),
            where('startTime', '<=', endOfMonth)
        );
    
        try {
            const querySnapshot = await getDocs(q);
            const events = [];
            querySnapshot.forEach(doc => {
                const eventData = doc.data();
                if (eventData.startTime) {
                    events.push({ 
                        ...eventData, 
                        id: doc.id,
                        is_family_event: eventData.is_family_event || false // Убедимся, что поле есть
                    });
                }
            });
    
            console.log('Загруженные события:', events); // Логируем загруженные события
            return events;
        } catch (error) {
            console.error('Ошибка при получении событий:', error);
            return [];
        }
    }

    async fetchEventsForDate(date) {
        const eventsRef = collection(db, 'calendar_events');
        const q = query(eventsRef, where('calendar_id', '==', this.calendarId));

        try {
            const querySnapshot = await getDocs(q);
            const events = [];
            const selectedDate = dayjs(date);

            querySnapshot.forEach(doc => {
                const eventData = doc.data();
                if (eventData.startTime) {
                    const eventDate = dayjs(eventData.startTime.toDate());
                    if (eventDate.isSame(selectedDate, 'day')) {
                        events.push({ 
                            ...eventData, 
                            id: doc.id,
                            is_family_event: eventData.is_family_event || false // Убедимся, что поле есть
                        });
                    }
                }
            });

            events.sort((a, b) => {
                const timeA = dayjs(a.startTime.toDate()).format('HH:mm');
                const timeB = dayjs(b.startTime.toDate()).format('HH:mm');
                return timeA.localeCompare(timeB);
            });

            return events;
        } catch (error) {
            console.error('Ошибка при получении событий:', error);
            return [];
        }
    }

    async updateEventDescription(eventId, newDescription) {
        try {
            const eventRef = doc(db, 'calendar_events', eventId);
            await updateDoc(eventRef, { discription: newDescription });
            return true;
        } catch (error) {
            console.error('Ошибка при обновлении описания:', error);
            return false;
        }
    }

    async deleteEvent(eventId) {
        try {
            const eventRef = doc(db, 'calendar_events', eventId);
            await deleteDoc(eventRef);
            return true;
        } catch (error) {
            console.error('Ошибка при удалении события:', error);
            return false;
        }
    }

    async getCalendarNameById(calendarId) {
        try {
            if (!calendarId || typeof calendarId !== 'string') {
                console.error('Ошибка: calendarId должен быть непустой строкой.');
                return null;
            }

            const calendarDocRef = doc(db, 'calendars', calendarId);
            const calendarDoc = await getDoc(calendarDocRef);

            if (calendarDoc.exists()) {
                const calendarData = calendarDoc.data();
                if (calendarData.calendar_name) {
                    return calendarData.calendar_name;
                } else {
                    console.error('Ошибка: поле calendar_name отсутствует в документе.');
                    return null;
                }
            } else {
                console.error('Ошибка: документ с указанным calendarId не найден.');
                return null;
            }
        } catch (error) {
            console.error('Ошибка при поиске документа:', error);
            return null;
        }
    }
}