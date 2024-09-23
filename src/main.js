var form = document.getElementById("investment-form");
var formURL = document.getElementById("in-url");
var formQuantity = document.getElementById("in-quantity");
var formCurrencyCode = document.getElementById("in-currency");
var formCost = document.getElementById("in-cost");
var saveFormData = function () {
    var investmentURL = formURL.value;
    var investmentQuantity = Number(formQuantity.value);
    var investmentCurrencyCode = Number(formCurrencyCode.value);
    //Needs to change commas into decimal points
    var investmentCost = Number(formCost.value);
    var userInfo = {
        itemURL: investmentURL,
        quantity: investmentQuantity,
        currencyCode: investmentCurrencyCode,
        cost: investmentCost,
    };
    if (localStorage.getItem("investments") === null) {
        var investments = [];
        investments.push(userInfo);
        localStorage.setItem("investments", JSON.stringify(investments));
    }
    else {
        var storedInvestments = JSON.parse(localStorage.getItem("investments"));
        storedInvestments.push(userInfo);
        localStorage.setItem("investments", JSON.stringify(storedInvestments));
    }
};
var resetForm = function () {
    formURL.value = "";
    formQuantity.value = "";
    formCost.value = "";
};
if (form.onsubmit) {
    form.onsubmit = function (event) {
        event.preventDefault();
        if (form.checkValidity()) {
            saveFormData();
            alert("Investment registered");
            resetForm();
        }
        else {
            form.reportValidity();
        }
    };
}
var printFormData = function () {
    console.log("Unparsed:" + localStorage.getItem("investments"));
    console.log("Parsed:" + JSON.parse(localStorage.getItem("investments")));
};
