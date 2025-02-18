"use strict";
/*
TODO:
POPUP IF API FAILS TO LOAD DATA
 */
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
//Handle error with grabbing api data. probably do alert box alerting users to cors anywhere.
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
            let formattedPrice = 0;
            let currency = "";
            //Testing to see if this will allow non-existing market listings to be shown
            if (apiData.lowest_price === undefined) {
                apiData.lowest_price = null;
                formattedPrice = null;
            }
            else {
                //Removing currency symbol (since sometimes it's shown in front, sometimes in back) and decimals/commas.
                let numbersOnly = apiData.lowest_price.replace(/[^0-9]+/g, "");
                //Add decimal back to number
                let addedDecimal = numbersOnly.slice(0, -2) + "." + numbersOnly.slice(-2);
                //Convert processed string back into number
                formattedPrice = Number(addedDecimal);
                //Extract used currency.
                currency = apiData.lowest_price.replace(/[0-9,.]+/g, "");
            }
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
//Handle function when there are no investments to display.
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
                if (datum.currentPrice === null) {
                    priceField.textContent = "UNAVAILABLE";
                }
                else {
                    priceField.textContent =
                        datum.currencySymbol + datum.currentPrice.toFixed(2);
                }
            }
            const profitField = currentInvestment.querySelector(".profit-field");
            let profitCalculation;
            if (datum.currentPrice != null) {
                profitCalculation = datum.currentPrice - datum.cost;
            }
            else {
                profitCalculation = null;
            }
            console.log(datum.currentPrice + " - " + datum.cost + " = " + profitCalculation);
            if (profitField) {
                if (datum.currentPrice === null) {
                    profitField.textContent = "N/A";
                }
                else {
                    if (profitCalculation) {
                        if (profitCalculation < 0) {
                            profitField.classList.add("text-red-500");
                            //Fixing minus sign position for proper syntax with currency symbol
                            profitField.textContent =
                                "-" +
                                    datum.currencySymbol +
                                    Math.abs(profitCalculation).toFixed(2);
                        }
                        else if (profitCalculation > 0) {
                            profitField.textContent =
                                datum.currencySymbol + profitCalculation.toFixed(2);
                            profitField.classList.add("text-green-500");
                        }
                        else {
                            profitField.textContent =
                                datum.currencySymbol + profitCalculation.toFixed(2);
                        }
                    }
                    else {
                        profitField.textContent = "N/A";
                    }
                }
            }
            const totalField = currentInvestment.querySelector(".total-field");
            let totalProfit;
            if (profitCalculation) {
                totalProfit = profitCalculation * datum.quantity;
            }
            else {
                totalProfit = null;
            }
            if (totalField) {
                if (datum.currentPrice === null) {
                    totalField.textContent = "N/A";
                }
                else {
                    if (profitCalculation) {
                        if (profitCalculation < 0) {
                            totalField.classList.add("text-red-500");
                            totalField.textContent =
                                "-" +
                                    datum.currencySymbol +
                                    Math.abs(profitCalculation * datum.quantity).toFixed(2);
                        }
                        else if (profitCalculation > 0) {
                            totalField.classList.add("text-green-500");
                            totalField.textContent =
                                datum.currencySymbol +
                                    Math.abs(profitCalculation * datum.quantity).toFixed(2);
                        }
                        else {
                            totalField.textContent =
                                datum.currencySymbol +
                                    Math.abs(profitCalculation * datum.quantity).toFixed(2);
                        }
                    }
                    else {
                        totalField.textContent = "N/A";
                    }
                }
            }
            //Too many requests error right now. Check if works later.
            clone.classList.remove("hidden");
            clone.classList.add("flex");
            if (grid) {
                grid.appendChild(clone);
            }
            counter++;
        }
    }
};
const preventDecimal = (inputField) => {
    if (inputField.value.indexOf(".") != -1) {
        inputField.value = inputField.value.replace(".", "");
    }
};
const preventNonNumber = (inputField) => {
    inputField.value = inputField.value.replace(/[^0-9]/g, "");
};
const quantityInput = document.getElementById("in-quantity");
if (quantityInput) {
    quantityInput.addEventListener("input", (event) => {
        preventNonNumber(event.target);
    });
}
const formatCurrencyInput = (inputField) => {
    //Normalise decimal point syntax
    if (inputField.value) {
        //Prevent any non-decimal symbols
        inputField.value = inputField.value.replace(/[^0-9.,]/g, "");
        //Standardise decimal point display
        if (inputField.value.indexOf(",") != -1) {
            inputField.value = inputField.value.replace(",", ".");
        }
        //Prevent more than one decimal point
        let decimalCount = (inputField.value.match(/\./g) || []).length;
        if (decimalCount > 1) {
            inputField.value = inputField.value.slice(0, -1);
        }
        //Limit numbers to 2 d.p. to encourage matching standard currency format
        inputField.value =
            inputField.value.indexOf(".") >= 0
                ? inputField.value.slice(0, inputField.value.indexOf(".") + 3)
                : inputField.value;
    }
};
const costInput = document.getElementById("in-cost");
if (costInput) {
    costInput.addEventListener("input", (event) => {
        formatCurrencyInput(event.target);
    });
}
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
