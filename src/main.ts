type UserInvestment = {
  itemURL: string;
  quantity: number;
  currencyCode: number;
  cost: number;
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

  //Needs to change commas into decimal points
  const investmentCost: number = Number(formCost.value);

  const userInfo: UserInvestment = {
    itemURL: investmentURL,
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
    } else {
      form.reportValidity();
    }
  };
}

const printFormData = () => {
  console.log("Unparsed:" + localStorage.getItem("investments"));
  console.log("Parsed:" + JSON.parse(localStorage.getItem("investments")!));
};
