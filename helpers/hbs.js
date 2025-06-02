const moment = require('moment');
module.exports = {
    formatDate: function (date, targetFormat) {
        return moment(date).format(targetFormat);
    },

    radioCheck: function (value, radioValue) {
        if (value === radioValue) {
            return 'checked';
        }
        return '';
    },

    equalto: function (comparing, compared) {
        if (comparing == compared) {
            return true;
        }
        else {
            return false;
        }
    },

    greaterthan: function (comparing, compared) {
        if (comparing > compared) {
            return true;
        }
        else {
            return false;
        }
    },

    replaceCommas: function (str) {
        if (str != null || str.length !== 0) {   // check for null and empty string
            if (str.trim().length !== 0) {
                // Replace the ',' to '|'. Use pattern-matching string /,/g for ','
                return str.replace(/,/g, ' | ');
            }
        }
        return 'None';  // display 'None' if got no subtitles
    },

    maskEmail: function (email) {
        var masked_Email = email.replace(/^(.)(.*)(.@.*)$/,
            (_, a, b, c) => a + b.replace(/./g, '*') + c
        );

        return masked_Email;
    },

    get_Item_Total: function (price, quantity) {
        return Math.round(((parseFloat(price) * parseInt(quantity)) + Number.EPSILON) * 100) / 100;
    },

    staffCheck: function (staffValue) {
        if (staffValue == "Staff") {
            return "";
        }
        else {
            return String('display:none');
        }
    },
    adminCheck: function (adminValue) {
        if (adminValue == "Admin") {
            return "";
        }
        else {
            return String('display:none');
        }
    },
    userCheck: function (userValue) {
        if (userValue == "User") {
            return "";
        }
        else {
            return String('display:none');
        }
    },

    calculateTotal: function (data) {
        var total = 0;
        for (i=0; i<data.length; i++){
            total += data[i]["item_Total"];
        }
        return total;
    }

};
