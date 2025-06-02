$(document).ready(function(){

    switch($('#item_Status').text()){
        case "Order Processing":
            $('.progress-bar').css("width", "15%");
            break;
        case "Preparing to Ship":
            $('.progress-bar').css("width", "35%");
            break;
        case "Shipped":
            $('.progress-bar').css("width", "65%");
            break;
        case "Delivered":
            $('.progress-bar').css("width", "100%");
            break;
    }

});