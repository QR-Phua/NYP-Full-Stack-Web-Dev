$(document).ready(function () {

    console.log($('.alert:contains(Spend more than $1000, after discount, to get free shipping!)'));

    var all_Alerts = $('.alert');

    console.log(all_Alerts[0].classList);
    if (all_Alerts.length > 1) {
        
        console.log('2 Alerts');
        setTimeout(function() {
            all_Alerts[0].remove();
            all_Alerts = $('.alert');
        }, 1000);

    } else {
        console.log("1 alerts");
    }

    var discount_Percentage = 0;

    if ($("#discount_Input").val()) {

        $.post("/shopping/viewCart",
            {
                'action': 'validate_Promo',
                'code': $("#discount_Input").val()
            }, function (response) { // success handler

                if (parseInt(response["cart_Discount"]) != 0) {

                    $('#discount_Spinner').css('visibility', 'hidden');
                    $('#cart_Total').text("$" + response['cart_Total']);
                    $('#cart_Discount').text("$" + response['cart_Discount']);
                    $('#discount_Applied').css("display", "block");
                    $('#discount_Applied').css("color", "green");
                    $('#discount_Applied').text("Your discount code has been applied");
                } else {

                    $('#discount_Spinner').css('visibility', 'hidden');
                    $('#cart_Total').text("$" + response['cart_Total']);
                    $('#cart_Discount').text("$" + response['cart_Discount']);
                    $('#discount_Applied').css("display", "block");
                    $('#discount_Applied').css("color", "red");

                    if (Boolean(response['require_Login'])){
                        $('#discount_Applied').text("Please login to use this code");
                    } else {
                        $('#discount_Applied').text("This discount code is unusable");
                    }


                }
 
            });
    }

    $('#nxtPage').click(function () {
        $('#nxtPage').html('<span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>Check Out');

    });

    $(".deleteProduct").on("click", function (e) {
        e.preventDefault(); // cancel the link itself
        var id = $(this).attr('id');

        $.post("/shopping/viewCart",
            {
                'action': 'remove_Product',
                'index_Value': id,
            },
            function () {
                window.location.replace('/shopping/viewCart');
            });

    });

    /*
    var current_Total = parseFloat($('#cart_Subtotal').text());
    var new_Total = (discount / 100) * current_Total;

    var amount_Saved = current_Total - new_Total;
    $('#cart_Discount').text(Math.round((amount_Saved + Number.EPSILON) * 100) / 100);

    */


    let timeout = null;
    $('#discount_Input').on('input', function () {
        $('#discount_Spinner').css('visibility', 'visible');
        clearTimeout(timeout);

        if ($(this).val()) {

            timeout = setTimeout(
                $.post("/shopping/viewCart",
                    {
                        'action': 'validate_Promo',
                        'code': $(this).val()
                    }, function (response) { // success handler
                        if (parseInt(response["cart_Discount"]) != 0) {
                            console.log("YES discount!");
                            $('#discount_Spinner').css('visibility', 'hidden');
                            $('#cart_Total').text("$" + response['cart_Total']);
                            $('#cart_Discount').text("$" + response['cart_Discount']);
                            $('#discount_Applied').css("display", "block");
                            $('#discount_Applied').css("color", "green");
                            $('#discount_Applied').text("Your discount code has been applied");
                        } else {
                            console.log("No discount!");
                            $('#discount_Spinner').css('visibility', 'hidden');
                            $('#cart_Total').text("$" + response['cart_Total']);
                            $('#cart_Discount').text("$" + response['cart_Discount']);
                            $('#discount_Applied').css("display", "block");
                            $('#discount_Applied').css("color", "red");
                            
                            if (Boolean(response['require_Login'])){
                                $('#discount_Applied').text("Please login to use this code");
                            } else {
                                $('#discount_Applied').text("This discount code is unusable");
                            }
                        }

                        if (Boolean(response['free_Shipping']) == true) {
                            $('#shipping-Value').text('Free Shipping').css('color','green');
                            
                            $('.alert').each(function (){
                                console.log($(this)[0].classList);
                                if ($(this).children().first().text().trim() != "Item removed from cart!") {
                                    if ($(this)[0].classList.contains('alert-info')) {
                                        $(this).removeClass('alert-info');
                                    }
    
                                    if (!$(this)[0].classList.contains('alert-success')) {
                                        $(this).addClass('alert-success');
                                        $(this).children().first().text("You qualify for free shipping!").css('color','#155724');
                                    }
                                }
                            });
    
                        } else {
                            $('#shipping-Value').text('To be calculated').css('color','black');
    
                            $('.alert').each(function (){
                                if ($(this).children().first().text().trim() != "Item removed from cart!") {
                                    if ($(this)[0].classList.contains('alert-success')) {
                                        $(this).removeClass('alert-success');
                                    }
    
                                    if (!$(this)[0].classList.contains('alert-info')) {
                                        $(this).addClass('alert-info');
                                        $(this).children().first().text("Spend more than $1000, after discount, to get free shipping!").css('color','#0c5460');
                                    }
                                }
                            });
    
                            
                        }

                    }), 5000);
        } else {
            $('#discount_Spinner').css('visibility', 'hidden');
            $('#discount_Applied').css("display", "none");
            $('#cart_Discount').text("$0");
            $('#cart_Total').text($('#cart_Subtotal').text());

        }
    });

    $(".minus").on("click", function (e) {
        var current_Quantity = parseInt($(this).closest("p").children("span[name='quantity']").text());
        var id = $(this).closest("p").children("span[name='quantity']").attr('id');

        if (current_Quantity - 1 >= 1) {
            $(this).closest("p").children("span[name='quantity']").text(current_Quantity - 1);
        }

        var index_Value = id.split("_");

        index_Value = parseInt(index_Value[1]);
        var element_Selector = "#warning_" + index_Value;
        $(element_Selector).css("visibility", "hidden");

        $.post("/shopping/viewCart",
            {
                'action': 'update_Quantity',
                'operation': 'minus',
                'index_Value': id,
            },
            function (response) {
                
                if (response["action"] == "delete") {
                    window.location.replace('/shopping/viewCart');
                } else {
                    $(this).closest("p").children("span[name='quantity']").text(response["item_Quantity"]);
                    var element_Selector = "#item_" + response['index_Value'] + "_total";
                    $(element_Selector).text("$" + response['item_Total']);
                    $('#cart_Subtotal').text("$" + response['cart_Subtotal']);
                    $('#cart_Discount').text("$" + response['cart_Discount']);
                    $('#cart_Total').text("$" + response['cart_Total']);

                    if (Boolean(response['free_Shipping']) == true) {
                        $('#shipping-Value').text('Free Shipping').css('color','green');
                        
                        $('.alert').each(function (){
                            console.log($(this)[0].classList);
                            console.log($(this).children().first().text().trim());
                            if ($(this).children().first().text().trim() != "Item removed from cart!") {
                                if ($(this)[0].classList.contains('alert-info')) {
                                    $(this).removeClass('alert-info');
                                }

                                if (!$(this)[0].classList.contains('alert-success')) {
                                    $(this).addClass('alert-success');
                                    $(this).children().first().text("You qualify for free shipping!").css('color','#155724');
                                }
                            }
                        });

                    } else {
                        $('#shipping-Value').text('To be calculated').css('color','black');

                        $('.alert').each(function (){
                            console.log($(this).children().first().text().trim());
                            if ($(this).children().first().text().trim() != "Item removed from cart!") {
                                if ($(this)[0].classList.contains('alert-success')) {
                                    $(this).removeClass('alert-success');
                                }

                                if (!$(this)[0].classList.contains('alert-info')) {
                                    $(this).addClass('alert-info');
                                    $(this).children().first().text("Spend more than $1000, after discount, to get free shipping!").css('color','#0c5460');
                                }
                            }
                        });

                        
                    }
                }

            });

    });

    $(".plus").on("click", function (e) {
        var current_Quantity = parseInt($(this).closest("p").children("span[name='quantity']").text());
        var id = $(this).closest("p").children("span[name='quantity']").attr('id');

        if (current_Quantity + 1 <= 4) {
            $(this).closest("p").children("span[name='quantity']").text(current_Quantity + 1);
            $.post("/shopping/viewCart",
                {
                    'action': 'update_Quantity',
                    'index_Value': id,
                    'operation': 'add'
                },
                function (response) {
                    
                    var element_Selector = "#item_" + response['index_Value'] + "_total";
                    $(element_Selector).text("$" + response['item_Total']);
                    $('#cart_Subtotal').text("$" + response['cart_Subtotal']);
                    $('#cart_Discount').text("$" + response['cart_Discount']);
                    $('#cart_Total').text("$" + response['cart_Total']);

                    

                    if (Boolean(response['free_Shipping']) == true) {
                        $('#shipping-Value').text('Free Shipping').css('color','green');
                        
                        var element;
                        $('.alert').each(function (){
                            console.log($(this)[0].classList);
                            if ($(this).children().first().text().trim() != "Item removed from cart!") {
                                if ($(this)[0].classList.contains('alert-info')) {
                                    $(this).removeClass('alert-info');
                                }

                                if (!$(this)[0].classList.contains('alert-success')) {
                                    $(this).addClass('alert-success');
                                    $(this).children().first().text("You qualify for free shipping!").css('color','#155724');
                                }
                            }
                        });

                    } else {
                        $('#shipping-Value').text('To be calculated').css('color','black');

                        $('.alert').each(function (){
                            if ($(this).children().first().text().trim() != "Item removed from cart!") {
                                if ($(this)[0].classList.contains('alert-success')) {
                                    $(this).removeClass('alert-success');
                                }

                                if (!$(this)[0].classList.contains('alert-info')) {
                                    $(this).addClass('alert-info');
                                    $(this).children().first().text("Spend more than $1000, after discount, to get free shipping!").css('color','#0c5460');
                                }
                            }
                        });

                        
                    }

                });
        } else {
            var index_Value = id.split("_");

            index_Value = parseInt(index_Value[1]);
            var element_Selector = "#warning_" + index_Value;
            $(element_Selector).css("visibility", "visible");
        }

    });

});