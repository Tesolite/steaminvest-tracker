var form = document.getElementById("investment-form");
var formURL = document.getElementById("in-url");
var formQuantity = document.getElementById("in-quantity");
var formCurrencyCode = document.getElementById("in-currency");
var formCost = document.getElementById("in-cost");
var saveFormData = function () {
    var investmentURL = formURL.value;
    var investmentQuantity = Number(formQuantity.value);
    var investmentCurrencyCode = Number(formCurrencyCode.value);
    //Valid url is: https://steamcommunity.com/market/listings/{appID}/{marketHash}
    var tempURL = new URL(investmentURL);
    ///market/listings/{appID}/{marketHash}
    var path = tempURL.pathname;
    //[ '', 'market', 'listings', 'appID', 'marketHash' ]
    var directories = path.split("/");
    var investmentAppID = directories[3];
    var investmentMarketHash = directories[4];
    //Needs to change commas into decimal points
    //and remove both from quantity input.
    var investmentCost = Number(formCost.value);
    var userInfo = {
        itemURL: investmentURL,
        appID: investmentAppID,
        marketHash: investmentMarketHash,
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
var extractURLData = function () { };
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
