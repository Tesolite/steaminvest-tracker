"use strict";
const form = document.getElementById("investment-form");
const formURL = document.getElementById("in-url");
const formQuantity = document.getElementById("in-quantity");
const formCurrencyCode = document.getElementById("in-currency");
const formCost = document.getElementById("in-cost");
const saveFormData = () => {
    const investmentURL = formURL.value;
    const investmentQuantity = Number(formQuantity.value);
    const investmentCurrencyCode = Number(formCurrencyCode.value);
    //Valid url is: https://steamcommunity.com/market/listings/{appID}/{marketHash}
    const tempURL = new URL(investmentURL);
    ///market/listings/{appID}/{marketHash}
    const path = tempURL.pathname;
    //[ '', 'market', 'listings', '{appID}', '{marketHash}' ]
    const directories = path.split("/");
    const investmentAppID = directories[3];
    const investmentMarketHash = directories[4];
    //Needs to change commas into decimal points
    //and remove both from quantity input.
    const investmentCost = Number(formCost.value);
    const userInfo = {
        itemURL: investmentURL,
        appID: investmentAppID,
        marketHash: investmentMarketHash,
        quantity: investmentQuantity,
        currencyCode: investmentCurrencyCode,
        cost: investmentCost,
    };
    if (localStorage.getItem("investments") === null) {
        let investments = [];
        investments.push(userInfo);
        localStorage.setItem("investments", JSON.stringify(investments));
    }
    else {
        let storedInvestments = JSON.parse(localStorage.getItem("investments"));
        storedInvestments.push(userInfo);
        localStorage.setItem("investments", JSON.stringify(storedInvestments));
    }
};
const fetchAPIData = async () => {
    const investments = JSON.parse(localStorage.getItem("investments"));
    for (let investment of investments) {
        //Need to use https://cors-anywhere.herokuapp.com/corsdemo
        const apiURL = `https://cors-anywhere.herokuapp.com/https://steamcommunity.com/market/priceoverview/?currency=${investment.currencyCode}&appid=${investment.appID}&market_hash_name=${investment.marketHash}`;
        try {
            const response = await fetch(apiURL);
            if (!response.ok) {
                console.log("Response: " + response);
                console.log("Response Stringified: " + JSON.stringify(response));
                throw new Error(`Error fetching market data: (${response.status})`);
            }
            const apiData = await response.json();
            console.log("Lowest price: " + apiData.lowest_price);
            const investmentData = {
                quantity: investment.quantity,
                currencyCode: investment.currencyCode,
                cost: investment.cost,
                currentPrice: apiData.lowest_price,
            };
            if (localStorage.getItem("processedData") === null) {
                let processedInvestments = [];
                processedInvestments.push(investmentData);
                localStorage.setItem("processedData", JSON.stringify(processedInvestments));
            }
            else {
                let processedInvestments = JSON.parse(localStorage.getItem("processedData"));
                processedInvestments.push(investmentData);
                localStorage.setItem("processedData", JSON.stringify(processedInvestments));
            }
        }
        catch (error) {
            console.error(error);
        }
    }
};
const resetForm = () => {
    formURL.value = "";
    formQuantity.value = "";
    formCost.value = "";
};
if (form.onsubmit) {
    form.onsubmit = (event) => {
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
