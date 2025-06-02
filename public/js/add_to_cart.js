$(document).ready(function () {

    $(".addProduct").on("click", function (e) {
        e.preventDefault(); // cancel the link itself
        var id = $(this).attr('id');
        var quantity = parseInt($(".addProductQuantity").val());
        console.log(quantity);

        if (quantity >= 1 && quantity <= 4) {
            $.post("/shopping/viewCart",
                {
                    'action': 'add_Product',
                    'index_Value': id,
                    'quantity': quantity,
                },
                function (response) {
                    if (response["exceeded_Quantity"] == "true") {
                        $('#exceeded_Quantity').text("You have exceeded the maximum quantity in the cart for this item. Any additional quantity will not be added to cart");
                        $('#exceeded_Quantity').css('color', 'red');
                        $('#exceeded_Quantity').css('visibility', 'visible');
                    } else {
                        $('#exceeded_Quantity').text("Item has been added to cart");
                        $('#exceeded_Quantity').css('color', 'green');
                        $('#exceeded_Quantity').css('visibility', 'visible');
                    }
                    //window.location.replace('/shopping/viewCart');
                });

        } else {
            $('#exceeded_Quantity').text("Please enter a quantity value between 1 and 4");
            $('#exceeded_Quantity').css('color', 'red');
            $('#exceeded_Quantity').css('visibility', 'visible');
        }



    });

});