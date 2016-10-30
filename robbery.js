'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;


function RobberySchedule(schedule, duration, workingHours) {
    var self = this;
    self.weekdays = ['ПН', 'ВТ', 'СР'];
    self.tableMoments = [];
    self.thieves = [];

    function parseTime(timeStr) {
        var splitTime = timeStr.split(/[ :+]+/);

        return {
            day: self.weekdays.indexOf(splitTime[0]) + 1,
            hour: Number(splitTime[1]),
            minutes: Number(splitTime[2]),
            timezone: Number(splitTime[3])
        };
    }

    function getNode(time, who, available, shiftTimezone) {
        shiftTimezone = shiftTimezone || 0;

        return {
            time: new Date(2015, 5, time.day, time.hour + shiftTimezone, time.minutes, 0, 0),
            event: {
                who: who,
                available: available
            }
        };
    }

    function addTimeBankInTimeTable() {
        self.weekdays.forEach(function (day) {
            var fromTime = parseTime(day + ' ' + workingHours.from);
            self.tableMoments.push(getNode(fromTime, 'bank', true));
            var toTime = parseTime(day + ' ' + workingHours.to);
            self.tableMoments.push(getNode(toTime, 'bank', false));
        });
    }

    function addTimeThiefInTable(bankTimezone) {
        for (var thief in schedule) {
            if (!schedule.hasOwnProperty(thief)) {
                continue;
            }
            self.thieves.push(thief);
            var toDoList = schedule[thief];
            for (var i = 0; i < toDoList.length; i++) {
                var timeWhenBusy = toDoList[i];
                var fromTime = parseTime(timeWhenBusy.from);
                var shiftTimezone = bankTimezone - fromTime.timezone;
                self.tableMoments.push(getNode(fromTime, thief, false, shiftTimezone));
                var toTime = parseTime(timeWhenBusy.to);
                self.tableMoments.push(getNode(toTime, thief, true, shiftTimezone));
            }
        }
    }

    function fillTimeTable() {
        var bankTimeZone = parseTime('ПН ' + workingHours.from).timezone;

        addTimeBankInTimeTable();
        addTimeThiefInTable (bankTimeZone);
        self.tableMoments.sort(function (a, b) {
            return a.time - b.time;
        });
    }

    function isSuitableMoment(moment) {
        var suitable = true;

        self.thieves.forEach(function (thief) {
            if (!moment[thief]) {
                suitable = false;

                return false;
            }
        });
        if (!suitable) {
            return false;
        }

        return moment.bank && (moment.duration >= duration);
    }

    self.findAllSuitableMoment = function () {
        var suitableTime = [];
        var currentMoment = {};
        for (var i = 0; i < self.tableMoments.length - 1; i++) {
            var node = self.tableMoments[i];
            var nextNode = self.tableMoments[i + 1];
            currentMoment.duration = (nextNode.time - node.time) / (1000 * 60);
            currentMoment[node.event.who] = node.event.available;
            if (isSuitableMoment(currentMoment)) {
                suitableTime.push({
                    time: new Date(node.time.getTime()),
                    duration: currentMoment.duration
                });
            }
        }

        return suitableTime;
    };

    fillTimeTable();
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var self = this;
    self.robberySchedule = new RobberySchedule(schedule, duration, workingHours);
    self.allSuitableMoments = this.robberySchedule.findAllSuitableMoment();
    self.currentIndex = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return self.allSuitableMoments.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            function convertNumberToString(number) {
                return (number < 10) ? '0' + number.toString() : number.toString();
            }
            if (self.currentIndex >= self.allSuitableMoments.length) {
                return '';
            }
            var time = self.allSuitableMoments[self.currentIndex].time;

            return template
                .replace('%HH', convertNumberToString(time.getHours()))
                .replace('%MM', convertNumberToString(time.getMinutes()))
                .replace('%DD', self.robberySchedule.weekdays[time.getDate() - 1]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var halfHour = 30;
            var currentMoment = self.allSuitableMoments[self.currentIndex];

            if (currentMoment.duration - halfHour >= duration) {
                currentMoment.duration -= halfHour;
                currentMoment.time.setMinutes(currentMoment.time.getMinutes() + halfHour);

                return true;
            }
            if (self.currentIndex < self.allSuitableMoments.length - 1) {
                self.currentIndex++;

                return true;
            }

            return false;
        }
    };
};
