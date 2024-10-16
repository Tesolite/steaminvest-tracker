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
//Add functionality to prevent duplicates, especially when function is called
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
            //Need to change this so that commas for 1000s are not affected.
            let formattedPrice = apiData.lowest_price.replace(",", ".");
            //Removing currency symbol (since sometimes it's shown in front, sometimes in back).
            formattedPrice = formattedPrice.replace(/[^0-9,.]+/g, "");
            //Convert processed string back into number.
            formattedPrice = Number(formattedPrice);
            //Extract used currency.
            const currency = apiData.lowest_price.replace(/[0-9,.]+/g, "");
            console.log("Lowest price: " + apiData.lowest_price);
            console.log("Currency: " + currency);
            const investmentData = {
                itemName: investment.marketHash,
                quantity: investment.quantity,
                currencyCode: investment.currencyCode,
                currencySymbol: currency,
                cost: investment.cost,
                currentPrice: formattedPrice,
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
const getProcessedData = () => {
    const storedData = localStorage.getItem("processedData");
    if (storedData !== null) {
        const parsedStoredData = JSON.parse(storedData);
        console.log(JSON.stringify(parsedStoredData));
    }
};
const displayInvestments = async () => {
    //Update storage with up-to-date data.
    localStorage.removeItem("processedData");
    await fetchAPIData();
    const storedData = localStorage.getItem("processedData");
    if (storedData !== null) {
        const parsedStoredData = JSON.parse(storedData);
        let counter = 0;
        const grid = document.getElementById("investment-grid");
        for (let datum of parsedStoredData) {
            let clone = document
                .getElementById("investment-wrapper")
                ?.cloneNode(true);
            clone.id = `investment-${counter}`;
            const currentInvestment = clone;
            console.warn(`quantity-field of ${clone.id} is: ` +
                clone.querySelector(".quantity-field"));
            const nameField = currentInvestment.querySelector(".name-field");
            if (nameField) {
                nameField.textContent = decodeURI(datum.itemName);
            }
            const quantityField = currentInvestment.querySelector(".quantity-field");
            console.warn("quantityField is: " + quantityField);
            if (!quantityField) {
                console.error("quantity-field is null.");
            }
            if (quantityField) {
                console.log("quantity-field is not null!");
                quantityField.textContent = datum.quantity.toString();
            }
            const costField = currentInvestment.querySelector(".cost-field");
            if (costField) {
                costField.textContent = datum.currencySymbol + datum.cost.toFixed(2);
            }
            const priceField = currentInvestment.querySelector(".price-field");
            if (priceField) {
                priceField.textContent =
                    datum.currencySymbol + datum.currentPrice.toFixed(2);
            }
            const profitField = currentInvestment.querySelector(".profit-field");
            const profitCalculation = datum.currentPrice - datum.cost;
            console.log(datum.currentPrice + " - " + datum.cost + " = " + profitCalculation);
            if (profitField) {
                profitField.textContent =
                    datum.currencySymbol + profitCalculation.toFixed(2);
            }
            const totalField = currentInvestment.querySelector(".total-field");
            const totalProfit = profitCalculation * datum.quantity;
            if (totalField) {
                totalField.textContent = datum.currencySymbol + totalProfit.toFixed(2);
            }
            if (grid) {
                grid.appendChild(clone);
            }
            counter++;
        }
    }
};
const resetForm = () => {
    formURL.value = "";
    formQuantity.value = "";
    formCost.value = "";
};
if (form) {
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
else {
    console.log("No form found.");
}
