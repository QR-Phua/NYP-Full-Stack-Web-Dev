//const { query } = require("express");

$(document).ready(function () {

    var elements;
    var paymentElement;
    let stripe;

    checkStatus();

    document
        .querySelector("#credit_Card_Form")
        .addEventListener("submit", handleSubmit);
    
    async function initialize() {

        var shipping_Price = $("#shipping_Step_Form").serialize();
        var customer_Info = $("#customer_Info_Form").serialize();

        const response = await fetch("/shopping/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shipping_Price, customer_Info }),
        });

        const { clientSecret } = await response.json();

        const appearance = {
            theme: 'stripe',
        };

        const { publishableKey } = await fetch('/shopping/publishable-key').then(r => r.json());

        stripe = Stripe(publishableKey); // Your Publishable Key

        elements = stripe.elements({ appearance, clientSecret })

        paymentElement = elements.create("payment");
        paymentElement.mount("#payment-element");
        document.querySelector("#load_Spinner").classList.add("hidden");
        $("#stripe_Submit").css("display", "block");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Make sure to change this to your payment completion page
                return_url: "http://localhost:50000/shopping/paymentConfirmed-Stripe",
            },
        }).catch(err => {
            console.log(err);
            return { error: err };
        });

        console.log(error);

        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        if (error.type === "card_error" || error.type === "validation_error") {
            showMessage(error.message);
        } else {
            showMessage("An unexpected error occured.");
        }

        setLoading(false);
    }

    // Fetches the payment intent status after payment submission
    async function checkStatus() {

        const clientSecret = new URLSearchParams(window.location.search).get(
            "payment_intent_client_secret"
        );

        if (!clientSecret) {
            return;
        }

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        switch (paymentIntent.status) {
            case "succeeded":
                showMessage("Payment succeeded!");
                break;
            case "processing":
                showMessage("Your payment is processing.");
                break;
            case "requires_payment_method":
                showMessage("Your payment was not successful, please try again.");
                windows.location.replace('/shopping/checkOut');
                break;
            default:
                showMessage("Something went wrong.");
                break;
        }
    }

    checkStatus();

    // ------- UI helpers -------

    function showMessage(messageText) {
        const messageContainer = document.querySelector("#payment-message");

        messageContainer.classList.remove("hidden");
        messageContainer.textContent = messageText;

        setTimeout(function () {
            messageContainer.classList.add("hidden");
            messageText.textContent = "";
        }, 4000);
    }

    // Show a spinner on payment submission
    function setLoading(isLoading) {
        if (isLoading) {
            // Disable the button and show a spinner
            document.querySelector("#stripe_Submit").disabled = true;
            document.querySelector("#spinner").classList.remove("hidden");
            document.querySelector("#button-text").classList.add("hidden");

        } else {
            document.querySelector("#stripe_Submit").disabled = false;
            document.querySelector("#spinner").classList.add("hidden");
            document.querySelector("#button-text").classList.remove("hidden");

        }
    }


    if ($("#discount_Code").val()) {

        $.post("/shopping/viewCart",
            {
                'action': 'validate_Promo',
                'code': $("#discount_Code").val()
            }, function (response) { // success handler

                if (parseInt(response["cart_Discount"]) != 0) {

                    $('#discount_Spinner').css('visibility', 'hidden');
                    $('#order_Discount').text("$" + response['cart_Discount']);
                    $('#discount_Applied').css("display", "block");
                    $('#discount_Applied').css("color", "green");
                    $('#discount_Applied').text("Your discount code has been applied");
                } else {

                    $('#discount_Spinner').css('visibility', 'hidden');
                    $('#order_Discount').text("$" + response['cart_Discount']);
                    $('#discount_Applied').css("display", "block");
                    $('#discount_Applied').css("color", "red");
                    $('#discount_Applied').text("This discount code is unusable");
                }

            });
    }

    var emptyStringPattern = /([^\s])/;
    var valid_Text_Pattern = /^[-a-zA-Z0-9-()]+(\s+[-a-zA-Z0-9-()]+)*$/;
    var valid_Num_Pattern = /^\d+$/;
    
    var fN_Check = false;
    if ($("input[name='firstName']").val()){
        if ($("input[name='firstName']").val().length == 0 || !(emptyStringPattern.test($("input[name='firstName']").val())) ) {
            console.log("ERROR FN");
            fN_Check = false;
            $("label[name='fN_Warning']").css('visibility', 'visible');

        } else if (valid_Text_Pattern.test($("input[name='firstName']").val())) {
            fN_Check = true;
            $("label[name='fN_Warning']").css('visibility', 'hidden');
        }
    }

    $("input[name='firstName']").on('input', function () {
        if ($(this).val().length == 0 || !(emptyStringPattern.test($(this).val()))) {
            fN_Check = false;
            $("label[name='fN_Warning']").css('visibility', 'visible');

        } else if (valid_Text_Pattern.test($(this).val())) {
            fN_Check = true;
            $("label[name='fN_Warning']").css('visibility', 'hidden');
        }

    });

    
    var lN_Check = false;
    if($("input[name='lastName']").val()){
        if ($("input[name='lastName']").val().length == 0 || !(emptyStringPattern.test($("input[name='lastName']").val()))) {
            lN_Check = false;
            $("label[name='lN_Warning']").css('visibility', 'visible');

        } else if (valid_Text_Pattern.test($("input[name='lastName']").val())) {
            lN_Check = true;
            $("label[name='lN_Warning']").css('visibility', 'hidden');
        }
    }

    $("input[name='lastName']").on('input', function () {
        if ($(this).val().length == 0 || !(emptyStringPattern.test($(this).val()))) {
            lN_Check = false;
            $("label[name='lN_Warning']").css('visibility', 'visible');

        } else if (valid_Text_Pattern.test($(this).val())) {
            lN_Check = true;
            $("label[name='lN_Warning']").css('visibility', 'hidden');
        }

    });
    
    var email_Check = false;
    var emailPattern = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if ($("input[name='email']").val()){
        if ($("input[name='email']").val().length > 0) {

            if (!emailPattern.test($("input[name='email']").val())) {
                email_Check = false;
                $("label[name='email_Warning']").html('Please enter a valid email address').css('visibility', 'visible');

            } else {
                email_Check = true;
                $("label[name='email_Warning']").css('visibility', 'hidden');
            }

        } else {
            email_Check = false;
            $("label[name='email_Warning']").html('Please enter your email address').css('visibility', 'visible');
        }
    }

    $("input[name='email']").on('input', function () {

        if ($(this).val().length > 0) {

            if (!emailPattern.test($(this).val())) {
                email_Check = false;
                $("label[name='email_Warning']").html('Please enter a valid email address').css('visibility', 'visible');

            } else {
                email_Check = true;
                $("label[name='email_Warning']").css('visibility', 'hidden');
            }

        } else {
            email_Check = false;
            $("label[name='email_Warning']").html('Please enter your email address').css('visibility', 'visible');
        }
    });

    
    var pN_Check = false;
    if($("input[name='phone']").val()){
        if ($("input[name='phone']").val().length > 0) {
            if (!valid_Num_Pattern.test($("input[name='phone']").val())) {
                pN_Check = false;
                $("label[name='pN_Warning']").html('Please enter a valid phone number').css('visibility', 'visible');

            } else {
                pN_Check = true;
                $("label[name='pN_Warning']").css('visibility', 'hidden');
            }

        } else {
            pN_Check = false;
            $("label[name='pN_Warning']").html('Please enter a phone number').css('visibility', 'visible');
        }
    }

    $("input[name='phone']").on('input', function () {
        if ($(this).val().length > 0) {
            if (!valid_Num_Pattern.test($(this).val())) {
                pN_Check = false;
                $("label[name='pN_Warning']").html('Please enter a valid phone number').css('visibility', 'visible');

            } else {
                pN_Check = true;
                $("label[name='pN_Warning']").css('visibility', 'hidden');
            }

        } else {
            pN_Check = false;
            $("label[name='pN_Warning']").html('Please enter a phone number').css('visibility', 'visible');
        }

    });

    
    var address_Check = false;
    if($("input[name='streetAddress']").val()){
        if ($("input[name='streetAddress']").val().length == 0 || !(emptyStringPattern.test($("input[name='streetAddress']").val()))) {
            address_Check = false;
            $("label[name='address_Warning']").css('visibility', 'visible');

        } else if (valid_Text_Pattern.test($("input[name='streetAddress']").val())) {
            address_Check = true;
            $("label[name='address_Warning']").css('visibility', 'hidden');
        }
    }

    $("input[name='streetAddress']").on('input', function () {
        if ($(this).val().length == 0 || !(emptyStringPattern.test($(this).val()))) {
            address_Check = false;
            $("label[name='address_Warning']").css('visibility', 'visible');

        } else if (valid_Text_Pattern.test($(this).val())) {
            address_Check = true;
            $("label[name='address_Warning']").css('visibility', 'hidden');
        }

    });
    
    var city_Check = false;
    if ($("input[name='city']").val()) {
        if ($("input[name='city']").val().length == 0 || !(emptyStringPattern.test($("input[name='city']").val()))) {
            city_Check = false;
            $("label[name='city_Warning']").css('visibility', 'visible');

        } else if (valid_Text_Pattern.test($("input[name='city']").val())) {
            city_Check = true;
            $("label[name='city_Warning']").css('visibility', 'hidden');
        }
    }

    $("input[name='city']").on('input', function () {
        if ($(this).val().length == 0 || !(emptyStringPattern.test($(this).val()))) {
            city_Check = false;
            $("label[name='city_Warning']").css('visibility', 'visible');

        } else if (valid_Text_Pattern.test($(this).val())) {
            city_Check = true;
            $("label[name='city_Warning']").css('visibility', 'hidden');
        }

    });
    
    var country_Check = false;
    
    var prefill_Country = $("select[name='country']").attr("data-value");
    console.log(prefill_Country);
    if (prefill_Country == null || prefill_Country == ""){
        $("select[name='country']").val("Select country");
    } else {
        $("select[name='country']").val(prefill_Country);
    }
    /*
    if(prefill_Country.length > 0){
        $("select[name='country'] > option").each(function() {
            if (this.text == prefill_Country){
                console.log(this);
                this.attr('selected','selected');
            }
        });
    } */
    
    if ($("select[name='country']").val()) {
        if ($("select[name='country']").find(":selected").text() === "Select country") {
            country_Check = false;
            $("label[name='country_Warning']").css('visibility', 'visible');

        } else {
            country_Check = true;
            $("label[name='country_Warning']").css('visibility', 'hidden');
        }
    } 

    $("select[name='country']").on('change', function () {
        if ($(this).find(":selected").text() === "Select country") {
            country_Check = false;
            $("label[name='country_Warning']").css('visibility', 'visible');

        } else {
            country_Check = true;
            $("label[name='country_Warning']").css('visibility', 'hidden');
        }
    });

    
    var postCode_Check = false;
    if($("input[name='postCode']").val()){
        if ($("input[name='postCode']").val().length > 0) {
            if (!valid_Num_Pattern.test($("input[name='postCode']").val())) {
                postCode_Check = false;
                $("label[name='postCode_Warning']").html('Please enter a valid postal code or zipcode').css('visibility', 'visible');

            } else {
                postCode_Check = true;
                $("label[name='postCode_Warning']").css('visibility', 'hidden');
            }

        } else {
            postCode_Check = false;
            $("label[name='postCode_Warning']").html('Please enter a postal code or zipcode').css('visibility', 'visible');
        }
    }

    $("input[name='postCode']").on('input', function () {

        if ($(this).val().length > 0) {
            if (!valid_Num_Pattern.test($(this).val())) {
                postCode_Check = false;
                $("label[name='postCode_Warning']").html('Please enter a valid postal code or zipcode').css('visibility', 'visible');

            } else {
                postCode_Check = true;
                $("label[name='postCode_Warning']").css('visibility', 'hidden');
            }

        } else {
            postCode_Check = false;
            $("label[name='postCode_Warning']").html('Please enter a postal code or zipcode').css('visibility', 'visible');
        }

    });
    

    var Customer_Info_Filled = false;

    $("#form-1-Btn").click(function () {    // customer info validation
        console.log("button clicked");
        var check_List = [fN_Check, lN_Check, email_Check, pN_Check, address_Check,
            city_Check, country_Check, postCode_Check];

        var checker = check_List.every(Boolean);
        console.log(checker);
        if (checker) {

            $('#customerInfoStep').css('display', 'none');

            $('#shippingStep').css('display', 'block');

            Customer_Info_Filled = true;

            check_List = [];

            console.log($("#customer_Info_Form").serialize());


        } else {
            if (!fN_Check) {
                $("label[name='fN_Warning']").css('visibility', 'visible');
            }
            if (!lN_Check) {
                $("label[name='lN_Warning']").css('visibility', 'visible');
            }
            if (!email_Check) {
                $("label[name='email_Warning']").css('visibility', 'visible');
            }
            if (!pN_Check) {
                $("label[name='pN_Warning']").css('visibility', 'visible');
            }
            if (!address_Check) {
                $("label[name='address_Warning']").css('visibility', 'visible');
            }
            if (!city_Check) {
                $("label[name='city_Warning']").css('visibility', 'visible');
            }
            if (!country_Check) {
                $("label[name='country_Warning']").css('visibility', 'visible');
            }
            if (!postCode_Check) {
                $("label[name='postCode_Warning']").css('visibility', 'visible');
            }

            Customer_Info_Filled = false;
        }
    });

    $('#payment_CC').css('box-shadow', "0px 14px 28px 0px rgba(0, 0, 0, 0.2)");
    $('#payment_CC').css('transition', '0.3s');
    $('#payment_CC').css('border-radius', '10px');

    $('#payment_CC_Img').click(function () {
        $('#payPal').css('display', 'none');
        $('#creditCard').css('display', 'block');
        $('#form-3-Btn').css('visibility', 'visible');
        if ($('#payment_Paypal').hasClass('img_Active')) {
            $('#payment_Paypal').removeClass('img_Active');
            $('#payment_Paypal').css('box-shadow', "none");
        }

        if ($('#payment_CC').hasClass('img_Active')) {

        } else {
            $('#payment_CC').addClass('img_Active');
            $('#payment_CC').css('box-shadow', "0px 14px 28px 0px rgba(0, 0, 0, 0.2)");
            $('#payment_CC').css('transition', '0.3s');
            $('#payment_CC').css('border-radius', '10px');
        }

    });

    $('#payment_Paypal_Img').click(function () {
        $('#creditCard').css('display', 'none');
        $('#payPal').css('display', 'block');
        $('#form-3-Btn').css('visibility', 'hidden');
        if ($('#payment_CC').hasClass('img_Active')) {

            $('#payment_CC').removeClass('img_Active');
            $('#payment_CC').css('box-shadow', "none");
        }

        if ($('#payment_Paypal_Img').hasClass('img_Active')) {
        } else {
            $('#payment_Paypal').addClass('img_Active');
            $('#payment_Paypal').css('box-shadow', "0px 14px 28px 0px rgba(0, 0, 0, 0.2)");
            $('#payment_Paypal').css('transition', '0.3s');
            $('#payment_Paypal').css('border-radius', '10px');
        }

    })


    $('#shippingBack').click(function () {
        $('#shippingStep').css('display', 'none');
        $('#customerInfoStep').css('display', 'block');
    });

    $('#form-2-Btn').click(function () {

        var shipping_Price = $("#shipping_Step_Form").serialize();
        var customer_Info = $("#customer_Info_Form").serialize();

        $.post("/shopping/saveProgress",
            {
                'shipping_Price': shipping_Price,
                'shipping_Type': $("input[name='productShippingSelector']:checked").attr("shipping"),
                'customer_Info': customer_Info,
            }, function (response) {
                initialize();
                $('#shippingStep').css('display', 'none');
                $('#paymentStep').css('display', 'block');
            });

    });

    $('#paymentBack').click(function () {
        $('#paymentStep').css('display', 'none');
        $('#shippingStep').css('display', 'block');
        $("#stripe_Submit").css("display", "none");
        paymentElement.destroy();
        document.querySelector("#load_Spinner").classList.remove("hidden");

    });


    if (!Customer_Info_Filled) {
        $('#customerInfoStep').css('display', 'block');
        $('#shippingStep').css('display', 'none');
        $('#paymentStep').css('display', 'none');
    }


    $("#CVV_toolTip").hover(function () {
        $('[data-toggle="tooltip').tooltip();
    });

    var subtotal = parseFloat($("#order_Subtotal").text().replace('$', ''));

    var free_Shipping;
    var shipping_Cost;
    if ($("#shipping_Cost").text() == 'Free Shipping'){
        shipping_Cost = 0.00;
        free_Shipping = true;
    } else {
        shipping_Cost = parseFloat($("#shipping_Cost").text().replace('$', ''));
        free_Shipping = false;
    }

    var discount = parseFloat($("#order_Discount").text().replace('$', ''));
    var order_Total = Math.round((subtotal + shipping_Cost - discount + Number.EPSILON) * 100) / 100;


    $("#order_Total").text("$" + order_Total);

    $("input[name='productShippingSelector']").change(function () {
        
        if (!free_Shipping){
            $("#shipping_Cost").text("$" + $("input[name='productShippingSelector']:checked").val());
            shipping_Cost = parseFloat($("#shipping_Cost").text().replace('$', ''));
        }
        
        order_Total = Math.round((subtotal + shipping_Cost - discount + Number.EPSILON) * 100) / 100;

        $("#order_Total").text("$" + order_Total);
    });

    let timeout = null;
    $('#discount_Code').keyup(function () {
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

                            $('#discount_Spinner').css('visibility', 'hidden');
                            $('#order_Discount').text("$" + response['cart_Discount']);
                            discount = parseFloat(response['cart_Discount']);
                            $('#discount_Applied').css("display", "block");
                            $('#discount_Applied').css("color", "green");
                            $('#discount_Applied').text("Your discount code has been applied");
                            $('#order_Total').text("$" + Math.round((subtotal + shipping_Cost - discount + Number.EPSILON) * 100) / 100);
                        } else {

                            $('#discount_Spinner').css('visibility', 'hidden');
                            $('#order_Discount').text("$" + response['cart_Discount']);
                            discount = parseFloat(response['cart_Discount']);
                            $('#discount_Applied').css("display", "block");
                            $('#discount_Applied').css("color", "red");
                            $('#discount_Applied').text("This discount code is unusable");
                            $('#order_Total').text("$" + Math.round((subtotal + shipping_Cost - discount + Number.EPSILON) * 100) / 100);
                        }

                    }), 5000);
        } else {
            $('#discount_Spinner').css('visibility', 'hidden');
            $('#discount_Applied').css("display", "none");
            $('#order_Discount').text("$0");
            $('#order_Total').text("$" + Math.round((subtotal + shipping_Cost - discount + Number.EPSILON) * 100) / 100);
        }


    });



});