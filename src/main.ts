//Type for investment data from form
type UserInvestment = {
  itemURL: string;
  appID: string;
  marketHash: string;
  quantity: number;
  currencyCode: number;
  cost: number;
};

//Type used for processing and displaying user's investments
type InvestmentInfo = {
  itemName: string;
  quantity: number;
  currencyCode: number;
  currencySymbol?: string;
  cost: number;
  currentPrice: number | null;
};

//enum containing all popup categories
enum ToastCategory {
  FormSubmitSuccess,
  APIRequestStatus,
}

//Variables for form and form input fields
const form = document.getElementById("investment-form") as HTMLFormElement;
const formURL = document.getElementById("in-url") as HTMLInputElement;
const formQuantity = document.getElementById("in-quantity") as HTMLInputElement;
const formCurrencyCode = document.getElementById(
  "in-currency",
) as HTMLInputElement;
const formCost = document.getElementById("in-cost") as HTMLInputElement;

//Toast close button
const btnCloseToast: HTMLButtonElement = document.querySelector(
  ".btn-close-toast",
) as HTMLButtonElement;

//Event listened for toat close button
btnCloseToast.addEventListener("click", (): void => {
  hideToast(btnCloseToast);
});

//Function for displaying toast notifications based on popup type and status code(if applicable)
const displayToast = (
  notificationType: ToastCategory,
  statusCode?: number,
): void => {
  //Form submission notification handling
  if (notificationType === ToastCategory.FormSubmitSuccess) {
    const formToastWindow: HTMLDivElement = document.getElementById(
      "form-toast",
    ) as HTMLDivElement;
    const toastText: HTMLDivElement = document.getElementById(
      "form-message",
    ) as HTMLDivElement;

    toastText.textContent = "Form submitted successfully!";
    formToastWindow.classList.replace("hidden", "flex");
    //Timeout to let transition-all tailwind class smoothly animate popup
    setTimeout(() => {
      formToastWindow.classList.replace("opacity-0", "opacity-100");
    }, 10);

    //API error status code notification handling
  } else if (notificationType === ToastCategory.APIRequestStatus) {
    const statusToastWindow: HTMLDivElement = document.getElementById(
      "status-toast",
    ) as HTMLDivElement;
    const toastText: HTMLSpanElement = document.getElementById(
      "status-message",
    ) as HTMLSpanElement;
    if (statusCode === 403) {
      toastText.textContent =
        "Error 403: Did you enable the CORS Anywhere proxy?";
    } else if (statusCode === 429) {
      toastText.textContent = "Error 429: Too many requests. Come back later.";
    }

    statusToastWindow.classList.replace("hidden", "flex");
    setTimeout(() => {
      statusToastWindow.classList.replace("opacity-0", "opacity-100");
    }, 10);
  }
};

//Function for dismissing toast notification
const hideToast = (toastExit: HTMLButtonElement): void => {
  //Get parent containing exit button
  const toast = toastExit.parentElement;

  if (toast) {
    toast.classList.replace("flex", "hidden");
    toast.classList.replace("opacity-100", "opacity-0");
  }
};

//Function for saving form data
const saveFormData = (): void => {
  const investmentURL: string = formURL.value; //URL of item

  const investmentQuantity: number = Number(formQuantity.value); //How many were purchased

  const investmentCurrencyCode: number = Number(formCurrencyCode.value); //Currency used for purchase

  //Valid url is: https://steamcommunity.com/market/listings/{appID}/{marketHash}
  const tempURL = new URL(investmentURL);

  ///market/listings/{appID}/{marketHash}
  const path: string = tempURL.pathname;
  //[ '', 'market', 'listings', '{appID}', '{marketHash}' ]
  const directories: string[] = path.split("/");

  const investmentAppID: string = directories[3]; //ID of item's game
  const investmentMarketHash: string = directories[4]; //ID of item on market

  //Convert user's item cost into number
  const investmentCost: number = Number(formCost.value);

  //Store input data into variable
  const userInfo: UserInvestment = {
    itemURL: investmentURL,
    appID: investmentAppID,
    marketHash: investmentMarketHash,
    quantity: investmentQuantity,
    currencyCode: investmentCurrencyCode,
    cost: investmentCost,
  };

  //Create investments array in localstorage if it doesn't exist
  if (localStorage.getItem("investments") === null) {
    let investments: Array<UserInvestment> = [];
    //Add user's form data into array
    investments.push(userInfo);
    //Convert into valid format
    localStorage.setItem("investments", JSON.stringify(investments));

    //If array exists, retrieve data, push new data into array, and save again
  } else {
    let storedInvestments: Array<UserInvestment> = JSON.parse(
      localStorage.getItem("investments") as string,
    );
    storedInvestments.push(userInfo);
    localStorage.setItem("investments", JSON.stringify(storedInvestments));
  }
};

//Fetch current data from steam's priceoverview API
const fetchAPIData = async () => {
  //Retrieve saved user data
  const investments: Array<UserInvestment> = JSON.parse(
    localStorage.getItem("investments")!,
  );

  //Retrieve market prices for each input investment through proxy to avoid CORS restrictions
  for (let investment of investments) {
    //Need to use https://cors-anywhere.herokuapp.com/corsdemo
    const apiURL = `https://cors-anywhere.herokuapp.com/https://steamcommunity.com/market/priceoverview/?currency=${investment.currencyCode}&appid=${investment.appID}&market_hash_name=${investment.marketHash}`;
    try {
      const response = await fetch(apiURL);

      //Handling response failure
      if (!response.ok) {
        displayToast(ToastCategory.APIRequestStatus, response.status);
        console.log("Response: " + response);
        throw new Error(
          `Error fetching market data: (Error ${response.status})`,
        );
      }

      const apiData = await response.json();

      let formattedPrice: number | null = 0;
      let currency: string = "";
      //If item is unavailable on market, set price as null to allow it to still display
      if (apiData.lowest_price === undefined) {
        apiData.lowest_price = null;
        formattedPrice = null;
      } else {
        //Removing currency symbol (since sometimes it's shown in front, sometimes in back) and decimals/commas.
        let numbersOnly: string = apiData.lowest_price.replace(/[^0-9]+/g, "");

        //Add decimal back to number
        let addedDecimal: string =
          numbersOnly.slice(0, -2) + "." + numbersOnly.slice(-2);
        //Convert processed string back into number
        formattedPrice = Number(addedDecimal);

        //Extract used currency.
        currency = apiData.lowest_price.replace(/[0-9,.]+/g, "");
      }

      //Variable for saving API-retrieved data
      const investmentData: InvestmentInfo = {
        itemName: investment.marketHash,
        quantity: investment.quantity,
        currencyCode: investment.currencyCode,
        currencySymbol: currency,
        cost: investment.cost,
        currentPrice: formattedPrice,
      };

      //Check if processed data is already present in user's storage, create array and push new data if not
      if (localStorage.getItem("processedData") === null) {
        let processedInvestments: Array<InvestmentInfo> = [];
        processedInvestments.push(investmentData);
        localStorage.setItem(
          "processedData",
          JSON.stringify(processedInvestments),
        );
        //If it exists, retrieve data, push new data, and save the updated array
      } else {
        let processedInvestments: Array<InvestmentInfo> = JSON.parse(
          localStorage.getItem("processedData")!,
        );
        processedInvestments.push(investmentData);
        localStorage.setItem(
          "processedData",
          JSON.stringify(processedInvestments),
        );
      }
    } catch (error) {
      console.error(error);
    }
  }
};

//Method used during debugging to check on stored data
const getProcessedData = () => {
  const storedData: string | null = localStorage.getItem("processedData");
  if (storedData !== null) {
    const parsedStoredData: Array<InvestmentInfo> = JSON.parse(storedData);
    console.log(JSON.stringify(parsedStoredData));
  }
};

//TODO: Handle function when there are no investments to display.
//Function for presenting the investment data to user
const displayInvestments = async () => {
  //Update storage with up-to-date data.
  localStorage.removeItem("processedData");
  await fetchAPIData();

  const storedData: string | null = localStorage.getItem("processedData");
  if (storedData !== null) {
    const parsedStoredData: Array<InvestmentInfo> = JSON.parse(storedData);
    let counter: number = 0;
    const grid = document.getElementById("investment-grid");

    //Copy the empty template for each datapoint in stored data
    for (let datum of parsedStoredData) {
      let clone = document
        .getElementById("investment-wrapper")
        ?.cloneNode(true) as HTMLDivElement;
      clone.id = `investment-${counter}`;

      const currentInvestment: HTMLDivElement = clone;

      //Fill template with investment info
      const nameField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".name-field");

      const quantityField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".quantity-field");

      const costField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".cost-field");

      const priceField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".price-field");

      const profitField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".profit-field");

      let profitCalculation: number | null;

      const totalField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".total-field");
      let totalProfit: number | null;

      if (nameField) {
        nameField.textContent = decodeURI(datum.itemName);
      }

      if (quantityField) {
        quantityField.textContent = datum.quantity.toString();
      }

      if (costField) {
        costField.textContent = datum.currencySymbol + datum.cost.toFixed(2);
      }

      if (priceField) {
        if (datum.currentPrice === null) {
          priceField.textContent = "UNAVAILABLE";
        } else {
          priceField.textContent =
            datum.currencySymbol + datum.currentPrice.toFixed(2);
        }
      }

      if (datum.currentPrice != null) {
        profitCalculation = datum.currentPrice - datum.cost;
      } else {
        profitCalculation = null;
      }
      if (profitField) {
        if (datum.currentPrice === null) {
          profitField.textContent = "N/A";
        } else {
          //Calculate profit and colour-code value
          if (profitCalculation) {
            if (profitCalculation < 0) {
              profitField.classList.add("text-red-500");

              //Fixing minus sign position for proper syntax with currency symbol
              profitField.textContent =
                "-" +
                datum.currencySymbol +
                Math.abs(profitCalculation).toFixed(2);
            } else if (profitCalculation > 0) {
              profitField.textContent =
                datum.currencySymbol + profitCalculation.toFixed(2);
              profitField.classList.add("text-green-500");
            } else {
              profitField.textContent =
                datum.currencySymbol + profitCalculation.toFixed(2);
            }
          } else {
            profitField.textContent = "N/A";
          }
        }
      }

      if (profitCalculation) {
        totalProfit = profitCalculation * datum.quantity;
      } else {
        totalProfit = null;
      }
      if (totalField) {
        if (datum.currentPrice === null) {
          totalField.textContent = "N/A";
        } else {
          //Calculate and colour-code total profit
          if (profitCalculation && totalProfit) {
            if (profitCalculation < 0) {
              totalField.classList.add("text-red-500");
              totalField.textContent =
                "-" + datum.currencySymbol + Math.abs(totalProfit).toFixed(2);
            } else if (profitCalculation > 0) {
              totalField.classList.add("text-green-500");
              totalField.textContent =
                datum.currencySymbol + Math.abs(totalProfit).toFixed(2);
            } else {
              totalField.textContent =
                datum.currencySymbol + Math.abs(totalProfit).toFixed(2);
            }
          } else {
            totalField.textContent = "N/A";
          }
        }
      }
      clone.classList.replace("hidden", "flex");

      //Add the filled-out template to grid
      if (grid) {
        grid.appendChild(clone);
      }
      counter++;
    }
  }
};

const preventDecimal = (inputField: HTMLInputElement): void => {
  if (inputField.value.indexOf(".") != -1) {
    inputField.value = inputField.value.replace(".", "");
  }
};

const preventNonNumber = (inputField: HTMLInputElement): void => {
  inputField.value = inputField.value.replace(/[^0-9]/g, "");
};

if (formQuantity) {
  formQuantity.addEventListener("input", (event) => {
    preventNonNumber(event.target as HTMLInputElement);
  });
}

//Ensure consistent format when recording currency input
const formatCurrencyInput = (inputField: HTMLInputElement): void => {
  //Normalise decimal point syntax
  if (inputField.value) {
    //Prevent any non-decimal symbols
    inputField.value = inputField.value.replace(/[^0-9.,]/g, "");

    //Standardise decimal point display
    if (inputField.value.indexOf(",") != -1) {
      inputField.value = inputField.value.replace(",", ".");
    }

    //Prevent more than one decimal point
    let decimalCount: number = (inputField.value.match(/\./g) || []).length;
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

if (formCost) {
  formCost.addEventListener("input", (event) => {
    formatCurrencyInput(event.target as HTMLInputElement);
  });
}

//Set all form values to be empty
const resetForm = () => {
  formURL.value = "";
  formQuantity.value = "";
  formCost.value = "";
};

//Submit form without needing to reset the page
if (form) {
  form.onsubmit = (event) => {
    event.preventDefault();
    if (form.checkValidity()) {
      saveFormData();
      displayToast(ToastCategory.FormSubmitSuccess);
      resetForm();
    } else {
      form.reportValidity();
    }
  };
} else {
  console.log("No form found.");
}

//auto-load investments when visiting investments page
document.addEventListener("DOMContentLoaded", (): void => {
  if (document.location.pathname.endsWith("investments.html")) {
    displayInvestments();
  }
});
