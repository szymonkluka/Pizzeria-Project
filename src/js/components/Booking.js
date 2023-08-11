import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.selectTableId;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initActions();
  }

  getData() {
    const thisBooking = this;

    const startDateParam = `${settings.db.dateStartParamKey}=${utils.dateToStr(
      thisBooking.datePicker.minDate
    )}`;
    const endDateParam = `${settings.db.dateEndParamKey}=${utils.dateToStr(
      thisBooking.datePicker.maxDate
    )}`;

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    console.log('getData parmas', params);

    const urls = {
      booking: `${settings.db.url}/${settings.db.booking}?${params.booking.join(
        '&'
      )}`,
      eventsCurrent: `${settings.db.url}/${
        settings.db.event
      }?${params.eventsCurrent.join('&')}`,
      eventsRepeat: `${settings.db.url}/${
        settings.db.event
      }?${params.eventsRepeat.join('&')}`,
    };

    console.log('urls', urls.booking, urls.eventsCurrent, urls.eventsRepeat);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        console.log('bookings', bookings);
        console.log('eventsCurrent', eventsCurrent);
        console.log('eventsRepeat', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        )
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
      }
    }

    thisBooking.updateDOM();

    console.log('thisBooking.booked', thisBooking.booked);
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  
  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
      table.classList.remove(classNames.booking.selected);
    }
    thisBooking.selectTableId = null;
    console.log('tojestbooking', thisBooking);
  }

  initTables(e) {
    const thisBooking = this;
    console.log(e.target);
    if (e.target.classList.contains('table')) {
      console.log('stolik');

      if (!e.target.classList.contains(classNames.booking.tableBooked)) {
        for (let table of thisBooking.dom.tables) {
          if (
            table.classList.contains(classNames.booking.selected) &&
            table !== e.target
          )
            table.classList.remove(classNames.booking.selected);
        }

        if (e.target.classList.contains(classNames.booking.selected)) {
          e.target.classList.remove(classNames.booking.selected);
          thisBooking.selectTableId = null;
        } else {
          e.target.classList.add(classNames.booking.selected);
          thisBooking.selectTableId = parseInt(
            e.target.getAttribute(settings.booking.tableIdAttribute)
          );
        }

        console.log('thisbooking', thisBooking.selectTableId);
      } else {
        alert('proszę wybrać dostępny stolik w celu dokonania rezerwacji');
      }
    }
  }

  render(element) {
    const thisBooking = this;
    const generatedHtml = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHtml;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );
    thisBooking.dom.floor = thisBooking.dom.wrapper.querySelector(
      select.booking.floor
    );
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(
      select.booking.phone
    );
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(
      select.booking.address
    );
    thisBooking.dom.submit = thisBooking.dom.wrapper.querySelector(
      select.booking.submit
    );
    thisBooking.dom.checkboxes = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.checkbox
    );
  }

  initWidgets() {
    const thisBooking = this;
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('updated', function () {});
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('updated', function () {});
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.dom.floor.addEventListener('click', function (e) {
      thisBooking.initTables(e);
    });
  }

  sendBooking() {
    const thisBooking = this;
    const url = `${settings.db.url}/${settings.db.booking}`;
    const payload = {
      date: thisBooking.date,
      hour: thisBooking.hourPicker.correctValue,
      table: thisBooking.selectTableId,
      duration: thisBooking.hoursAmount.correctValue,
      ppl: thisBooking.peopleAmount.correctValue,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    console.log('payload:', payload);

    if (thisBooking.dom.checkboxes[1].checked) {
      payload.starters.push(
        
        thisBooking.dom.checkboxes[1].value
      );
    } 
    
    if (thisBooking.dom.checkboxes[0].checked) {
      payload.starters.push(
        
        thisBooking.dom.checkboxes[0].value
      );
    } 
    
    
    if(this.selectTableId==null){
      alert('wybierz stolik');
      return;
    }
    
    if(thisBooking.dom.phone.value==''){
      alert('uzupełnij nr telefonu');
      return;
    }
    if(thisBooking.dom.address.value==''){
      alert('uzupełnij adres');
      return;
    }

    const bookingsToday = thisBooking.booked[thisBooking.date]; // wszystkie bookingi dla dzisiaj
    console.log([thisBooking.date]);
    console.log(thisBooking.booked);
    const beginTime = utils.hourToNumber(thisBooking.hourPicker.correctValue); // od kiedy sprawdzamy godziny? (liczba)
    console.log(utils.hourToNumber);
    console.log(thisBooking.hourPicker.correctValue);
    const endTime = beginTime + Number(thisBooking.hoursAmount.correctValue); // do kiedy sprawdzamy godziny? (liczba)

    // odfiltrujmy godziny do sprawdzenia - z bookingsToday wyciągamy wszystkie wartości z przedziału begin - end
    const hoursToCheck = Object.keys(bookingsToday).filter(function (hour) {
      return hour >= beginTime && hour < endTime;
    });

    let isTableFree = true; // zachowajmy informację czy stolik jest wolny

    // iterujemy po godzinach - jeśli tableId jest zajęty w godzinach
    // pomiędzy startem i końcem - stolik jest zajęty
    hoursToCheck.forEach(function (hour) {
      if (
        isTableFree &&
        bookingsToday[hour].includes(thisBooking.selectTableId)
      ) {
        isTableFree = false;
      }
    });

    if (!isTableFree) {
      alert('Nie możemy przygotować rezerwacji, stolik w wybranym przedziale czasowym jest już zajęty. Prosimy o sprawdzenie dostępności pozostałych stolików. Przepraszamy za utrudnienia');
      return;
    }


    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse:', parsedResponse);
        thisBooking.makeBooked(
          parsedResponse.date,
          parsedResponse.hour,
          parsedResponse.duration,
          parsedResponse.table
        );
        thisBooking.updateDOM();
        console.log('thisBooking.booked after response:', thisBooking.booked);
      });
  }

  initActions() {
    const thisBooking = this;
    thisBooking.dom.submit.addEventListener('click', function (e) {
      e.preventDefault();
      thisBooking.sendBooking();
    });
  }
}

export default Booking;
