'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;


function RobberySchedule(schedule, duration, workingHours) {
    this.weekdays = ['ПН', 'ВТ', 'СР'];
    this.events = [];
    this.robbers = [];
    this.allSuitableMoments = [];

    this.addEvent = function (timeStr, who, available, shiftTimezone) {
        shiftTimezone = shiftTimezone || 0;
        var time = parseTime(timeStr, this.weekdays);
        var event = {
            time: new Date(2015, 5, time.day, time.hour + shiftTimezone, time.minutes, 0, 0),
            event: {
                name: who,
                available: available
            }
        };

        this.events.push(event);
    };

    this.addBankNodes = function () {
        var self = this;

        this.weekdays.forEach(function (day) {
            self.addEvent(day + ' ' + workingHours.from, 'bank', true);
            self.addEvent(day + ' ' + workingHours.to, 'bank', false);
        });
    };

    this.addRobbersNodes = function (bankTimezone) {
        for (var thief in schedule) {
            if (!schedule.hasOwnProperty(thief)) {
                continue;
            }

            var robberSchedule = schedule[thief];

            this.robbers.push(thief);
            for (var i = 0; i < robberSchedule.length; i++) {
                var fromTime = parseTime(robberSchedule[i].from, this.weekdays);
                var shiftTimezone = bankTimezone - fromTime.timezone;

                this.addEvent(robberSchedule[i].from, thief, false, shiftTimezone);
                this.addEvent(robberSchedule[i].to, thief, true, shiftTimezone);
            }
        }
    };

    this.fillEvents = function () {
        var bankTimeZone = parseTime('ПН ' + workingHours.from, this.weekdays).timezone;

        this.addBankNodes();
        this.addRobbersNodes (bankTimeZone);
        this.events.sort(function (a, b) {
            return a.time - b.time;
        });
    };

    this.findAllSuitableMoment = function () {
        var currentMoment = getBeginMoment(this.robbers);
        for (var i = 0; i < this.events.length - 1; i++) {
            var node = this.events[i];
            var nextNode = this.events[i + 1];
            var MILLISECONDS_IN_MINUTE = 1000 * 60;

            currentMoment.duration = (nextNode.time - node.time) / (MILLISECONDS_IN_MINUTE);
            currentMoment[node.event.name] = node.event.available;
            if (isSuitableMoment(currentMoment, this.robbers)) {
                this.allSuitableMoments.push({
                    time: new Date(node.time.getTime()),
                    duration: currentMoment.duration
                });
            }
        }

        return this.allSuitableMoments;
    };

    this.fillEvents();

    function parseTime(timeStr, weekdays) {
        var splitTime = timeStr.split(/[ :+]/);

        return {
            day: weekdays.indexOf(splitTime[0]) + 1,
            hour: Number(splitTime[1]),
            minutes: Number(splitTime[2]),
            timezone: Number(splitTime[3])
        };
    }

    function isSuitableMoment(event, robbers) {
        var suitableForRobbers = robbers.every(function (robber) {
            return event[robber];
        });

        return suitableForRobbers && event.bank && (event.duration >= duration);
    }

    function getBeginMoment(robbers) {
        var currentMoment = {};

        robbers.forEach(function (thief) {
            currentMoment[thief] = true;
        });
        currentMoment.bank = false;

        return currentMoment;
    }
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
    var robberySchedule = new RobberySchedule(schedule, duration, workingHours);

    return {
        allSuitableMoments: robberySchedule.findAllSuitableMoment(),
        currentIndex: 0,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.allSuitableMoments.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.currentIndex >= this.allSuitableMoments.length) {
                return '';
            }
            var time = this.allSuitableMoments[this.currentIndex].time;

            return template
                .replace('%HH', supplementNumberZero(time.getHours()))
                .replace('%MM', supplementNumberZero(time.getMinutes()))
                .replace('%DD', robberySchedule.weekdays[time.getDate() - 1]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }
            var HALF_HOUR = 30;
            var currentMoment = this.allSuitableMoments[this.currentIndex];

            if (currentMoment.duration - HALF_HOUR >= duration) {
                currentMoment.duration -= HALF_HOUR;
                currentMoment.time.setMinutes(currentMoment.time.getMinutes() + HALF_HOUR);

                return true;
            }
            if (this.currentIndex < this.allSuitableMoments.length - 1) {
                this.currentIndex++;

                return true;
            }

            return false;
        }
    };
};

function supplementNumberZero(number) {
    return (number < 10) ? '0' + number.toString() : number.toString();
}
