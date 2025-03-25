// calendarUI.js
import 'https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js';
import 'https://cdn.jsdelivr.net/npm/dayjs@1/locale/ru.js'; // Поддержка русского языка
import { CalendarService } from './calendarService.js';

dayjs.locale('ru'); // Устанавливаем локаль на русский

export class CalendarUI {
    constructor(calendarService, familyCalendarService, container, telegramId) { // Добавляем familyCalendarService
        this.calendarService = calendarService;
        this.familyCalendarService = familyCalendarService; // Сохраняем familyCalendarService
        this.container = container;
        this.currentDate = dayjs();
        this.telegramId = telegramId; // Сохраняем telegramId
    }

    // Метод для затемнения цвета
    darkenColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
    }

    formatDuration(startTime, endTime) {
        const durationMinutes = endTime.diff(startTime, 'minute'); // Длительность в минутах
        const hours = Math.floor(durationMinutes / 60); // Часы
        const minutes = durationMinutes % 60; // Минуты

        if (hours > 0 && minutes > 0) {
            return `${hours}ч ${minutes}м`; // Например, "1ч 30м"
        } else if (hours > 0) {
            return `${hours}ч`; // Например, "1ч"
        } else {
            return `${minutes}м`; // Например, "30м"
        }
    }

    async renderCalendar() {
        const month = this.currentDate.month();
        const year = this.currentDate.year();
        const daysInMonth = this.currentDate.daysInMonth();
        const firstDayOfMonth = (this.currentDate.startOf('month').day() || 7) - 1; // День недели первого дня месяца (0 - Пн, 6 - Вс)
        const today = dayjs();
    
        // Получаем личные события
        const personalEvents = await this.calendarService.fetchEventsForMonth(year, month + 1);
    
        // Получаем семейные события
        const familyEvents = await this.familyCalendarService.fetchFamilyEvents(this.getCurrentUserId());
    
        // Исключаем события создателя из семейных событий
        const filteredFamilyEvents = familyEvents.filter(event => event.creatorId !== this.telegramId);
    
        // Объединяем личные и семейные события
        const events = [...personalEvents, ...filteredFamilyEvents];
    
        let calendarHTML = `<div class="calendar">
            <div class="header">
                <span>${this.currentDate.format('MMMM YYYY')}</span>
                <div class="header-buttons">
                    <button id="prev-month">
                        <img src="icon/left.svg" alt="Left Icon" width="24" height="24" >
                    </button>
                    <button id="next-month">
                        <img src="icon/right.svg" alt="Right Icon" width="24" height="24">
                    </button>
                </div>
            </div>
            <table class="calendar-table">
                <thead>
                    <tr>
                        <th>Пн</th>
                        <th>Вт</th>
                        <th>Ср</th>
                        <th>Чт</th>
                        <th>Пт</th>
                        <th>Сб</th>
                        <th>Вс</th>
                    </tr>
                </thead>
                <tbody>`;
    
        let day = 1;
        const prevMonth = this.currentDate.subtract(1, 'month');
        const nextMonth = this.currentDate.add(1, 'month');
        const daysInPrevMonth = prevMonth.daysInMonth();
    
        // Начинаем с чисел предыдущего месяца
        for (let i = 0; i < firstDayOfMonth; i++) {
            const prevMonthDay = daysInPrevMonth - firstDayOfMonth + i + 1;
            calendarHTML += `<td class="other-month">${prevMonthDay}</td>`;
        }
    
        // Отображаем числа текущего месяца
        for (let i = firstDayOfMonth; i < 7; i++) {
            const currentDay = dayjs(`${year}-${month + 1}-${day}`);
            const isToday = currentDay.isSame(today, 'day');
            const dayEvents = events.filter(event => {
                const eventDate = dayjs(event.startTime.toDate());
                return eventDate.isSame(currentDay, 'day');
            });
    
            const hasPersonalEvents = dayEvents.some(event => !event.is_family_event);
            const hasFamilyEvents = dayEvents.some(event => event.is_family_event);
    
            const todayClass = isToday ? 'today' : '';
            const eventsClass = hasPersonalEvents || hasFamilyEvents ? 'has-events' : '';
            const familyClass = hasFamilyEvents ? 'family-event' : '';
    
            calendarHTML += `<td class="${todayClass} ${eventsClass} ${familyClass}" data-date="${currentDay.format('YYYY-MM-DD')}">
                <div class="cell-content">${day}</div>
                <div class="event-mask"></div>
            </td>`;
            day++;
        }
        calendarHTML += `</tr>`;
    
        // Отображаем оставшиеся недели
        for (let i = 1; i < 6; i++) {
            calendarHTML += `<tr>`;
            for (let j = 0; j < 7; j++) {
                if (day > daysInMonth) {
                    // Отображаем числа следующего месяца
                    const nextMonthDay = day - daysInMonth;
                    calendarHTML += `<td class="other-month">${nextMonthDay}</td>`;
                    day++;
                } else {
                    const currentDay = dayjs(`${year}-${month + 1}-${day}`);
                    const isToday = currentDay.isSame(today, 'day');
                    const dayEvents = events.filter(event => {
                        const eventDate = dayjs(event.startTime.toDate());
                        return eventDate.isSame(currentDay, 'day');
                    });
    
                    const hasPersonalEvents = dayEvents.some(event => !event.is_family_event);
                    const hasFamilyEvents = dayEvents.some(event => event.is_family_event);
    
                    const todayClass = isToday ? 'today' : '';
                    const eventsClass = hasPersonalEvents || hasFamilyEvents ? 'has-events' : '';
                    const familyClass = hasFamilyEvents ? 'family-event' : '';
                    
                    // Добавляем класс has-event, если есть события
                    const hasEventClass = (hasPersonalEvents || hasFamilyEvents) ? 'has-event' : '';
    
                    calendarHTML += `<td class="${todayClass} ${eventsClass} ${familyClass}" data-date="${currentDay.format('YYYY-MM-DD')}">
                        <div class="cell-content">${day}</div>
                        <div class="event-mask"></div>
                    </td>`;
                    day++;
                }
            }
            calendarHTML += `</tr>`;
            if (day > daysInMonth) break;
        }
    
        calendarHTML += `</tbody></table></div>`;
        this.container.innerHTML = calendarHTML;
    
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate = this.currentDate.subtract(1, 'month');
            this.renderCalendar();
        });
    
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate = this.currentDate.add(1, 'month');
            this.renderCalendar();
        });
    
        document.querySelectorAll('.time-slot').forEach(slot => {
            const line = document.createElement('div');
            line.classList.add('time-line');
            slot.parentNode.insertBefore(line, slot.nextSibling);
        });
    
        const cells = this.container.querySelectorAll('.calendar-table td:not(.empty)');
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                const selectedDate = cell.getAttribute('data-date');
                this.displayEventsForDate(selectedDate);
    
                // Открываем выезжающее окно с событиями
                const eventsSlider = document.getElementById('events-slider');
                eventsSlider.style.bottom = '0'; // Окно выезжает снизу
            });
        });
    
        // Отображаем события на сегодняшний день при загрузке календаря
        const todayEvents = events.filter(event => {
            const eventDate = dayjs(event.startTime.toDate());
            return eventDate.isSame(today, 'day');
        });
    
        // После создания кнопок в JavaScript
        const prevMonthButton = document.getElementById('prev-month');
        const nextMonthButton = document.getElementById('next-month');
    
        if (prevMonthButton && nextMonthButton) {
            prevMonthButton.style.marginRight = '20px'; // Отступ справа от первой кнопки
        }
    
        console.log('Today events:', todayEvents); // Отладка
    
        if (todayEvents.length > 0) {
            this.displayEvents(todayEvents);
        }
    
        // Обработчик для закрытия окна
        const sliderHandle = document.querySelector('.slider-handle');
        if (sliderHandle) {
            console.log('Slider handle found!'); // Проверка, что элемент найден
            sliderHandle.addEventListener('click', () => {
                const eventsSlider = document.getElementById('events-slider');
                console.log('Current bottom value:', eventsSlider.style.bottom); // Проверка текущего значения
                eventsSlider.style.bottom = '-100%';
                console.log('New bottom value:', eventsSlider.style.bottom); // Проверка нового значения
            });
        } else {
            console.error('Slider handle not found!'); // Если элемент не найден
        }
    }

    async displayEventsForDate(date) {
        // Получаем личные события для выбранной даты
        const personalEvents = await this.calendarService.fetchEventsForDate(date);

        // Получаем семейные события для выбранной даты
        const familyEvents = await this.familyCalendarService.fetchFamilyEventsForDate(this.getCurrentUserId(), date);

        // Исключаем события создателя из семейных событий
        const filteredFamilyEvents = familyEvents.filter(event => event.creatorId !== this.telegramId);

        // Объединяем события
        const events = [...personalEvents, ...filteredFamilyEvents];

        this.displayEvents(events);
    }

    getCurrentUserId() {
        // Возвращаем telegramId текущего пользователя
        return this.telegramId;
    }



    async displayEvents(events) {
        const eventsContainer = document.getElementById('time');
        if (events.length > 0) {
            let eventsHTML = `<div class="events-list"><h3></h3>`; // Убираем <ul>, так как события будут отображаться на временной шкале
    
                // Получаем данные об исполнителях из localStorage
            const executorsData = JSON.parse(localStorage.getItem('executorsData')) || {};
            console.log('Executors Data from localStorage:', executorsData);
    
            // Сортируем события по времени начала
            events.sort((a, b) => {
                const aStart = dayjs(a.startTime.toDate());
                const bStart = dayjs(b.startTime.toDate());
                return aStart - bStart;
            });
    
            // Группируем события по времени начала
            const groupedEvents = {};
            events.forEach(event => {
                const eventTime = dayjs(event.startTime.toDate()).format('HH:mm');
                if (!groupedEvents[eventTime]) {
                    groupedEvents[eventTime] = [];
                }
                groupedEvents[eventTime].push(event);
            });
    
            // Массив для хранения информации о событиях
            const eventPositions = [];
    
            // Отображаем события
            for (const [time, eventGroup] of Object.entries(groupedEvents)) {
                const firstEvent = eventGroup[0];
                const eventTime = dayjs(firstEvent.startTime.toDate()).format('HH:mm');
                const familyClass = firstEvent.is_family_event ? 'family-event' : '';
                
                console.log('Event Executor ID:', firstEvent.executorId);
                console.log('Current User ID:', this.telegramId);
                
                // Получаем аватарку исполнителя из executorsData
                const executorAvatar = firstEvent.executorId ? 
                    executorsData[firstEvent.executorId]?.avatar || 'icon/notes.svg' : 
                    'icon/notes.svg';
                
                const avatarHTML = `<img src="${executorAvatar}" alt="Executor Avatar" class="executor-avatar">`;
    
                // Рассчитываем положение и высоту события, если есть время начала и окончания
                if (firstEvent.startTime && firstEvent.endTime) {
                    const startTime = dayjs(firstEvent.startTime.toDate());
                    const endTime = dayjs(firstEvent.endTime.toDate());
    
                    const startMinutes = startTime.hour() * 70 + startTime.minute(); // Время начала в минутах
                    const endMinutes = endTime.hour() * 70 + endTime.minute(); // Время окончания в минутах
                    const durationMinutes = endMinutes - startMinutes; // Длительность в минутах
                    const top = startMinutes + 35; // Смещаем события на 1 час вниз
                    const height = endMinutes - startMinutes; // Высота равна разнице в минутах
    
                    // Проверяем пересечение с другими событиями
                    let leftOffset = 10; // Начальный отступ слева (ближе к шкале времени)
                    let overlapCount = 0; // Счетчик наложений
                    for (const pos of eventPositions) {
                        if (top < pos.top + pos.height && top + height > pos.top) {
                            leftOffset += 20; // Сдвигаем событие вправо на 20px
                            overlapCount += 1; // Увеличиваем счетчик наложений
                        }
                    }
    
                    // Ограничиваем смещение вправо, чтобы события не выходили за пределы экрана
                    const maxOffset = window.innerWidth - 250; // Максимальное смещение (ширина экрана минус 250px)
                    leftOffset = Math.min(leftOffset, maxOffset);
    
                    // Сохраняем позицию текущего события
                    eventPositions.push({ top, height });
    
                    // Рассчитываем оттенок фона в зависимости от количества наложений
                    const baseColor = firstEvent.is_family_event ? '#28a745' : '#007bff';
                    const darkerColor = this.darkenColor(baseColor, overlapCount * 10); // Используем метод класса
    
                    // Проверяем длительность события
                    const showDescription = durationMinutes > 70; // Показываем описание, если событие длится больше часа
    
                    eventsHTML += `
                        <div class="event-item ${familyClass}" 
                             style="top: ${top}px; height: ${height}px; left: ${leftOffset}px; background-color: ${darkerColor};"
                             data-event-id="${firstEvent.id}">
                            <div class="event-title">${firstEvent.title}</div>
                            ${showDescription ? `<div class="event-description">${firstEvent.discription || ''}</div>` : ''}
                            <div class="event-duration">${this.formatDuration(startTime, endTime)}</div>
                            ${executorAvatar ? `<img src="${executorAvatar}" alt="Executor Avatar" class="executor-avatar">` : ''}
                            ${eventGroup.length > 1 ? `<div class="event-counter" data-time="${time}">+${eventGroup.length - 1}</div>` : ''}
                        </div>`;
    
                    // Если есть дополнительные события, добавляем их как скрытый список
                    if (eventGroup.length > 1) {
                        const groupHeight = (eventGroup.length - 1) * (height + 10); // Высота списка = количество событий * (высота карточки + отступ)
                        
                        const avatarHTML = executorAvatar ? `<img src="${executorAvatar}" alt="Executor Avatar" class="executor-avatar">` : '';
                        console.log('Avatar HTML:', avatarHTML);                        
                        
                        eventsHTML += `
                            <div class="event-group" data-time="${time}" style="top: ${top + height}px; left: ${leftOffset}px;">
                                ${eventGroup.slice(1).map((event, index) => {
                                    const eventTop = index * (height + 10); // Смещаем каждое событие на (высота + 10px) вниз
                                    return `
                                        <div class="event-item ${familyClass}" 
                                             style="top: ${eventTop}px; height: ${height}px; left: 0; background-color: ${darkerColor};"
                                             data-event-id="${event.id}">
                                            <div class="event-title">${event.title}</div>
                                            ${showDescription ? `<div class="event-description">${event.discription || ''}</div>` : ''}
                                            <div class="event-duration">${this.formatDuration(dayjs(event.startTime.toDate()), dayjs(event.endTime.toDate()))}</div>
                                            ${executorAvatar}
                                        </div>
                                    `;
                                }).join('')}
                            </div>`;
                    }
                } else {
                    // Если время начала или окончания не указано, отображаем событие как раньше
                    eventsHTML += `<li data-event-id="${firstEvent.id}" class="event-item ${familyClass}">${firstEvent.title} - ${eventTime}</li>`;
                }
            }
            eventsHTML += `</div>`;
            eventsContainer.innerHTML = eventsHTML;
    
            // Добавляем обработчики событий для клика по событиям
            const eventItems = eventsContainer.querySelectorAll('.event-item');
            eventItems.forEach(item => {
                item.addEventListener('click', () => {
                    const eventId = item.getAttribute('data-event-id');
                    const event = events.find(e => e.id === eventId);
    
                    // Проверяем, находится ли событие в раскрывающемся списке
                    const isInGroup = item.closest('.event-group') !== null;
    
                    if (isInGroup) {
                        // Если событие находится в раскрывающемся списке, просто открываем модальное окно
                        this.showEventModal(event);
                    } else {
                        // Если событие не в раскрывающемся списке, поднимаем его на первый план
                        const isOnTop = item.style.zIndex === '1000';
    
                        if (isOnTop) {
                            // Если событие уже на первом плане, открываем модальное окно
                            this.showEventModal(event);
                        } else {
                            // Если событие не на первом плане, поднимаем его на первый план
                            item.style.zIndex = '1000'; // Поднимаем событие на первый план
                            item.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)'; // Добавляем тень для визуального выделения
    
                            // Сбрасываем z-index и тень у всех других событий
                            eventItems.forEach(otherItem => {
                                if (otherItem !== item) {
                                    otherItem.style.zIndex = '1'; // Возвращаем другие события на обычный план
                                    otherItem.style.boxShadow = 'none'; // Убираем тень у других событий
                                }
                            });
                        }
                    }
                });
            });
    
            // Добавляем обработчики для счетчиков
            const eventCounters = eventsContainer.querySelectorAll('.event-counter');
            eventCounters.forEach(counter => {
                counter.addEventListener('click', (e) => {
                    e.stopPropagation(); // Останавливаем всплытие, чтобы не сработал клик по карточке
                    const time = counter.getAttribute('data-time');
                    const eventGroup = eventsContainer.querySelector(`.event-group[data-time="${time}"]`);
                    if (eventGroup) {
                        eventGroup.classList.toggle('expanded'); // Переключаем класс для раскрытия/скрытия
                    }
                });
            });
        } else {
            eventsContainer.innerHTML = `<div class="events-list"><p class="no-events">Событий на эту дату нет.</p></div>`;
        }
    }

    showEventModal(event) {
        const modal = document.getElementById('event-modal');
        const modalStartTime = document.getElementById('modal-start-time');
        const modalEndTime = document.getElementById('modal-end-time');
        const modalDescription = document.getElementById('modal-description');
        const editDescriptionIcon = document.getElementById('edit-description');
        const descriptionEdit = document.getElementById('description-edit');
        const saveDescriptionBtn = document.getElementById('save-description');
        const deleteEventBtn = document.getElementById('delete-event');

        modalStartTime.textContent = dayjs(event.startTime.toDate()).format('DD.MM.YYYY HH:mm');
        modalEndTime.textContent = event.endTime ? dayjs(event.endTime.toDate()).format('DD.MM.YYYY HH:mm') : 'Не указано';
        modalDescription.textContent = event.discription || 'Описание отсутствует';
        descriptionEdit.value = event.discription || '';

        modal.style.display = 'block';

        editDescriptionIcon.addEventListener('click', () => {
            modalDescription.style.display = 'none';
            descriptionEdit.style.display = 'block';
            saveDescriptionBtn.style.display = 'block';
            descriptionEdit.focus();
        });

        saveDescriptionBtn.addEventListener('click', async () => {
            const newDescription = descriptionEdit.value.trim();
            const success = await this.calendarService.updateEventDescription(event.id, newDescription);
            if (success) {
                modalDescription.textContent = newDescription || 'Описание отсутствует';
                modalDescription.style.display = 'block';
                descriptionEdit.style.display = 'none';
                saveDescriptionBtn.style.display = 'none';
                alert('Описание успешно обновлено!');
            } else {
                alert('Произошла ошибка при обновлении описания.');
            }
        });

        deleteEventBtn.addEventListener('click', async () => {
            const confirmDelete = confirm('Вы уверены, что хотите удалить это событие?');
            if (confirmDelete) {
                const success = await this.calendarService.deleteEvent(event.id);
                if (success) {
                    modal.style.display = 'none';
                    const selectedDate = event.startTime.toDate().toISOString().split('T')[0];
                    await this.displayEventsForDate(selectedDate);
                    alert('Событие успешно удалено!');
                } else {
                    alert('Произошла ошибка при удалении события.');
                }
            }
        });

        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }



    /*renderTimeSelector(container) {
        const timeHTML = `<div class="time-selector">
            <input type="time" id="time-input" step="1800">
        </div>`;
        container.innerHTML = timeHTML;

        document.getElementById('time-input').addEventListener('change', (e) => {
            const selectedTime = e.target.value;
            console.log('Выбрано время:', selectedTime);
        });
    }*/
}