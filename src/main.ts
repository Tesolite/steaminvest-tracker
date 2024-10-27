type UserInvestment = {
  itemURL: string;
  appID: string;
  marketHash: string;
  quantity: number;
  currencyCode: number;
  cost: number;
};

type InvestmentInfo = {
  itemName: string;
  quantity: number;
  currencyCode: number;
  currencySymbol: string;
  cost: number;
  currentPrice: number;
};
const form = document.getElementById("investment-form") as HTMLFormElement;
const formURL = document.getElementById("in-url") as HTMLInputElement;
const formQuantity = document.getElementById("in-quantity") as HTMLInputElement;
const formCurrencyCode = document.getElementById(
  "in-currency",
) as HTMLInputElement;
const formCost = document.getElementById("in-cost") as HTMLInputElement;

const saveFormData = (): void => {
  const investmentURL: string = formURL.value;

  const investmentQuantity: number = Number(formQuantity.value);

  const investmentCurrencyCode: number = Number(formCurrencyCode.value);

  //Valid url is: https://steamcommunity.com/market/listings/{appID}/{marketHash}
  const tempURL = new URL(investmentURL);

  ///market/listings/{appID}/{marketHash}
  const path: string = tempURL.pathname;
  //[ '', 'market', 'listings', '{appID}', '{marketHash}' ]
  const directories: string[] = path.split("/");

  const investmentAppID: string = directories[3];
  const investmentMarketHash: string = directories[4];

  //Needs to change commas into decimal points
  //and remove both from quantity input.
  const investmentCost: number = Number(formCost.value);

  const userInfo: UserInvestment = {
    itemURL: investmentURL,
    appID: investmentAppID,
    marketHash: investmentMarketHash,
    quantity: investmentQuantity,
    currencyCode: investmentCurrencyCode,
    cost: investmentCost,
  };

  if (localStorage.getItem("investments") === null) {
    let investments: Array<UserInvestment> = [];
    investments.push(userInfo);
    localStorage.setItem("investments", JSON.stringify(investments));
  } else {
    let storedInvestments: Array<UserInvestment> = JSON.parse(
      localStorage.getItem("investments")!,
    );
    storedInvestments.push(userInfo);
    localStorage.setItem("investments", JSON.stringify(storedInvestments));
  }
};

//Handle error with grabbing api data. probably do alert box alerting users to cors anywhere.
const fetchAPIData = async () => {
  const investments: Array<UserInvestment> = JSON.parse(
    localStorage.getItem("investments")!,
  );
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
      const investmentData: InvestmentInfo = {
        itemName: investment.marketHash,
        quantity: investment.quantity,
        currencyCode: investment.currencyCode,
        currencySymbol: currency,
        cost: investment.cost,
        currentPrice: formattedPrice,
      };

      if (localStorage.getItem("processedData") === null) {
        let processedInvestments: Array<InvestmentInfo> = [];
        processedInvestments.push(investmentData);
        localStorage.setItem(
          "processedData",
          JSON.stringify(processedInvestments),
        );
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

const getProcessedData = () => {
  const storedData: string | null = localStorage.getItem("processedData");
  if (storedData !== null) {
    const parsedStoredData: Array<InvestmentInfo> = JSON.parse(storedData);
    console.log(JSON.stringify(parsedStoredData));
  }
};

//Handle function when there are no investments to display.
const displayInvestments = async () => {
  //Update storage with up-to-date data.
  localStorage.removeItem("processedData");
  await fetchAPIData();

  const storedData: string | null = localStorage.getItem("processedData");
  if (storedData !== null) {
    const parsedStoredData: Array<InvestmentInfo> = JSON.parse(storedData);
    let counter: number = 0;
    const grid = document.getElementById("investment-grid");
    for (let datum of parsedStoredData) {
      let clone = document
        .getElementById("investment-wrapper")
        ?.cloneNode(true) as HTMLDivElement;
      clone.id = `investment-${counter}`;
      const currentInvestment = clone;

      console.warn(
        `quantity-field of ${clone.id} is: ` +
          clone.querySelector(".quantity-field"),
      );
      const nameField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".name-field");
      if (nameField) {
        nameField.textContent = decodeURI(datum.itemName);
      }
      const quantityField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".quantity-field");
      console.warn("quantityField is: " + quantityField);
      if (!quantityField) {
        console.error("quantity-field is null.");
      }
      if (quantityField) {
        console.log("quantity-field is not null!");
        quantityField.textContent = datum.quantity.toString();
      }
      const costField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".cost-field");
      if (costField) {
        costField.textContent = datum.currencySymbol + datum.cost.toFixed(2);
      }
      const priceField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".price-field");
      if (priceField) {
        priceField.textContent =
          datum.currencySymbol + datum.currentPrice.toFixed(2);
      }
      const profitField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".profit-field");
      const profitCalculation: number = datum.currentPrice - datum.cost;
      console.log(
        datum.currentPrice + " - " + datum.cost + " = " + profitCalculation,
      );
      if (profitField) {
        if (profitCalculation < 0) {
          profitField.classList.add("text-red-500");

          //Fixing minus sign position for proper syntax with currency symbol
          profitField.textContent =
            "-" + datum.currencySymbol + Math.abs(profitCalculation).toFixed(2);
        } else if (profitCalculation > 0) {
          profitField.textContent =
            datum.currencySymbol + profitCalculation.toFixed(2);
          profitField.classList.add("text-green-500");
        } else {
          profitField.textContent =
            datum.currencySymbol + profitCalculation.toFixed(2);
        }
      }

      const totalField: HTMLParagraphElement | null =
        currentInvestment.querySelector(".total-field");
      const totalProfit: number = profitCalculation * datum.quantity;
      if (totalField) {
        if (profitCalculation < 0) {
          totalField.classList.add("text-red-500");
          totalField.textContent =
            "-" + datum.currencySymbol + Math.abs(profitCalculation).toFixed(2);
        } else if (profitCalculation > 0) {
          totalField.classList.add("text-green-500");
          totalField.textContent =
            datum.currencySymbol + profitCalculation.toFixed(2);
        } else {
          totalField.textContent =
            datum.currencySymbol + profitCalculation.toFixed(2);
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
    } else {
      form.reportValidity();
    }
  };
} else {
  console.log("No form found.");
}
