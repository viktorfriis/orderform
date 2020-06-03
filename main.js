"use strict";
document.addEventListener("DOMContentLoaded", start);

const endPoint = "https://foobarexam.herokuapp.com/";
const restDBEndpoint = "https://frontendspring20-f2e0.restdb.io/rest/beers";
const APIKey = "5e957b2e436377171a0c2346";
const order = [];
const beerArray = [];
const HTML = {};
let orderTotal = 0;
let totalQuantity = 0;
// let beerPrice = 35;
let paymentOptionSelected = "counter";

let today = new Date().toString().substring(0, 3).toLowerCase();
console.log(today);

const Beer = {
  name: "",
  type: "",
  alc: "",
  price: "",
  desc: "",
  onTap: false,
  inOrder: false,
  amountInOrder: 0,
  popularity: 0,
};

const OrderItem = {
  name: "",
  amount: null,
};

function start() {
  console.log("START");

  HTML.totalPrice = document.querySelector("#cart_container p");
  HTML.totalPrice.textContent = totalQuantity + " - DKK " + orderTotal + ",00";
  HTML.mainTemplate = document.querySelector("#main-temp");
  HTML.orderItemTemplate = document.querySelector("#summary-temp");
  HTML.main = document.querySelector("main");
  HTML.orderItemContainer = document.querySelector("#order-item-container");
  HTML.payment = document.querySelector("#payment");
  HTML.placeOrderBtn = document.querySelector("#place-order-btn");
  HTML.orderConfirmation = document.querySelector("#order_confirmation");
  HTML.orderIDConfirmation = document.querySelector("#order_confirmation h2");
  HTML.placeNewOrderBtn = document.querySelector("#place-new-btn");
  HTML.mobilePay = document.querySelector("#mobilepay");
  HTML.counter = document.querySelector("#counter");
  HTML.processing = document.querySelector("#processing");
  HTML.cart = document.querySelector("#cart_container");
  HTML.logo = document.querySelector("#logo");

  DOMReady();
  fetchBeers();
}

function DOMReady() {
  //Viser kurven når der klikkes på kurven
  HTML.cart.addEventListener("click", () => {
    HTML.main.classList.add("hide-block");
    HTML.main.classList.remove("show-block");

    HTML.payment.classList.add("show-block");
    HTML.payment.classList.remove("hide-block");

    HTML.orderConfirmation.classList.remove("show-block");
    HTML.orderConfirmation.classList.add("hide-block");

    createSummary();
  });

  //Viser forsiden når der klikkes på logo
  HTML.logo.addEventListener("click", () => {
    HTML.main.classList.remove("hide-block");
    HTML.main.classList.add("show-block");

    HTML.payment.classList.remove("show-block");
    HTML.payment.classList.add("hide-block");

    HTML.orderConfirmation.classList.remove("show-block");
    HTML.orderConfirmation.classList.add("hide-block");
  });

  document.querySelector("#phone").setAttribute("novalidate", true);

  document.querySelector("#phone").addEventListener("submit", (e) => {
    e.preventDefault();

    if (paymentOptionSelected === "mobilepay") {
      //Hvis der er valgt mobilepay, tjekker vi om mobilnummeret er validt.
      if (document.querySelector("#phone-number").checkValidity()) {
        //Hvis det er validt, kalder vi placeOrder()
        placeOrder();
      } else {
        //Hvis det ikke er validt, viser vi error message
        document.querySelector(".error").classList.remove("hide-block");
        document.querySelector("#phone-number").addEventListener("focus", () => {
          document.querySelector(".error").classList.add("hide-block");
        });
      }
    } else {
      //Hvis der er valgt pay at counter, kalder vi placeOrder med det samme
      placeOrder();
    }
  });
}

function fetchBeers() {
  //Fetcher data fra endpoint med /beertypes, for at få generel information om øllene.
  fetch(endPoint + "beertypes", {
    method: "get",
  })
    .then((data) => data.json())
    .then((data) => {
      //Efter det fetcher vi fra endpointet direkte, for at få indformation om, om den enkelte øl er on tap.
      fetch(endPoint, {
        method: "get",
      })
        .then((dataBar) => dataBar.json())
        .then((dataBar) => {
          //Efter det fetcher vi fra vores egen database, hvor vi har information om øllenes popularitet.
          fetch(`${restDBEndpoint}?max=10`, {
            method: "get",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "x-apikey": `${APIKey}`,
              "cache-control": "no-cache",
            },
          })
            .then((restDBData) => restDBData.json())
            .then((restDBData) => {
              //Når alt er hentet kalder vi funktionen cleanData, med de 3 arrays som parameter.
              cleanData(data, dataBar, restDBData);
              document.querySelectorAll(".placeholder").forEach((placeholder) => placeholder.remove());
              document.querySelector("#number-one").classList.remove("hide-block");
            });
        });
    });
}

function cleanData(data, dataBar, restDBData) {
  //Vi bruger vores array fra /beertypes endpointet, til at bygge hver objekt til vores order form.
  data.forEach((beer) => {
    //Vi bruger vores prototype som er bygget på øverst, og fylder den ud for hver øl i arrayet.
    let beerItem = Object.create(Beer);

    //Her fylder vi protoypen ud med information om hver øl fra /beertypes endpointet.
    beerItem.name = beer.name;
    beerItem.type = beer.category;
    beerItem.alc = beer.alc;
    beerItem.price = Math.floor(beer.alc * 7);
    beerItem.desc = beer.description.overallImpression;

    /*For at finde ud af om den enkelte øl er på tap, kører vi en some metode på dataBar.taps arrayet, som er 
    arrayet over alle de øl der er på tap lige nu. Funktionen returnerer true hvis den er, og false hvis den
    ikke er.*/
    let onTap = dataBar.taps.some((tap) => {
      return tap.beer === beer.name;
    });
    beerItem.onTap = onTap;

    /*Vi bruger findIndex metoden på vores array fra vores egen database, til at finde indexet på den respektive
    øl. Det bruger vi bagefter til at sætte populariteten i prototypen*/
    const beerIndexPop = restDBData.findIndex((obj) => obj.name === beer.name);

    beerItem.color = restDBData[beerIndexPop].color;

    if (today === "mon") {
      beerItem.popularity = restDBData[beerIndexPop].salesMon;
    } else if (today === "tue") {
      beerItem.popularity = restDBData[beerIndexPop].salesTue;
    } else if (today === "wed") {
      beerItem.popularity = restDBData[beerIndexPop].salesWed;
    } else if (today === "thu") {
      beerItem.popularity = restDBData[beerIndexPop].salesThu;
    } else if (today === "fri") {
      beerItem.popularity = restDBData[beerIndexPop].salesFri;
    } else if (today === "sat") {
      beerItem.popularity = restDBData[beerIndexPop].salesSat;
    } else if (today === "sun") {
      beerItem.popularity = restDBData[beerIndexPop].salesSun;
    }

    //Til sidst tilføjer vi hver øl til vores lokale array beerArray.
    beerArray.push(beerItem);
  });

  /*beerArray bliver her sorteret. Først efter om øllene er på tap eller ej. Alle dem der ikke er på tap, bliver 
  vist til sidst. Herefter sorterer vi på popularitet.
  https://gomakethings.com/sorting-an-array-by-multiple-criteria-with-vanilla-javascript/*/
  const sortedArray = sortArray();

  console.log(sortedArray);

  //For hver øl i vores sorterede array kører vi funktionen showBeer, som skriver øllen ud i DOM'en.
  sortedArray.forEach((beer) => showBeer(beer));
  fetchSVGS();
}

function sortArray() {
  const sortedArray = beerArray.sort(function (a, b) {
    if (a.onTap > b.onTap) return -1;
    if (a.onTap < b.onTap) return 1;

    if (b.popularity > a.popularity) return 1;
    if (b.popularity < a.popularity) return -1;
  });

  return sortedArray;
}

function showBeer(beer) {
  //Vi laver en klon af vores template, som vi har lavet i HTML'en
  let klon = HTML.mainTemplate.cloneNode(true).content;

  //Klonen fylder vi så ud med de relevante info fra vores beerArray
  klon.querySelector(".beer").setAttribute("data-beertype", beer.name);
  klon.querySelector(".beer").style.setProperty("--beer-color", beer.color);
  klon.querySelector(".beer").style.setProperty("--beer-color-darken", darkenHEX(beer.color));
  klon.querySelector(".name").textContent = beer.name;
  klon.querySelector(".type").textContent = beer.type + " - " + beer.alc + "%";
  klon.querySelector(".price").textContent = "DKK " + beer.price + ",00";
  klon.querySelector(".infobox p").textContent = beer.desc;

  klon.querySelector(".info-icon").addEventListener("click", () => {
    toggleInfo(beer.name);
  });

  let onSummaryPage = false;

  //Vi sætter quantity til at være 0, så "bestillingen" nulstilles hver gang der refreshes
  let quantity = 0;

  //Hvis øllen er på tap gør vi plus og minus knapperne klikbare.
  if (beer.onTap) {
    klon.querySelector(".minus").addEventListener("click", () => {
      //Vi sætter quantity til at være lig med hvad der står i arrayet for den respektive øl.
      quantity = beer.amountInOrder;
      if (quantity != 0) {
        //Hvis quantity IKKE er lig med 0, minusser vi totalprisen, total quantity og den respektive øls quantity
        orderTotal = orderTotal - beer.price;
        totalQuantity--;
        quantity--;

        //Her opdaterer vi øllens prototype med den nye quantity
        beer.amountInOrder = quantity;

        /*Til sidst kalder vi updateOrder, med øllens navn, quantity og onSummaryPage variablen, som fortæller om vi er på 
        summary siden eller ej*/
        updateOrder(beer, quantity, onSummaryPage);
      }
    });

    klon.querySelector(".add").addEventListener("click", () => {
      //Vi sætter quantity til at være lig med hvad der står i arrayet for den respektive øl.
      quantity = beer.amountInOrder;

      //Vi ligger til på totalprisen, total quantity og den respektive øls quantity
      orderTotal = orderTotal + beer.price;
      totalQuantity++;
      quantity++;

      //Vi sætter beer.inOrder til at være true
      beer.inOrder = true;

      //Her opdaterer vi øllens prototype med den nye quantity, og kalder igen updateOrder, ligesom ovenfor.
      beer.amountInOrder = quantity;
      updateOrder(beer, quantity, onSummaryPage);
    });

    klon.querySelector(".quantity p").textContent = quantity;
  } else {
    //Hvis øllen IKKE er på tap, fjerner vi plus minus fra DOM'en, og skriver at den ikke er på tap.
    klon.querySelector(".price").textContent = "Not on tap right now";
    klon.querySelector(".beer").classList.add("not-on-tap");
    klon.querySelector(".beer").style.setProperty("--beer-color-darken", "black");
  }

  //Til sidst appender vi hver klon i vores main tag.
  HTML.main.appendChild(klon);
}

function toggleInfo(beer) {
  beerArray.forEach((beerInfo) => {
    if (beerInfo.name != beer) {
      document.querySelector(`[data-beertype='${beerInfo.name}']`).classList.remove("info-open");
    } else {
      document.querySelector(`[data-beertype='${beer}']`).classList.toggle("info-open");
    }
  });
}

function fetchSVGS() {
  //Her henter vi SVG overlayet til hver øl i DOM'en.
  fetch("svgs/overlay.svg", {
    method: "get",
  })
    .then((svg) => svg.text())
    .then((svg) => {
      document.querySelectorAll(".overlay_container").forEach((beer) => (beer.innerHTML = svg));
    });
}

function createSummary() {
  HTML.orderItemContainer.innerHTML = "";
  document.querySelector("#total p").textContent = "DKK " + orderTotal + ",00";

  if (order.length === 0) {
    //Hvis der ikke er nogle øl i kurven, skriver vi at kurven er tom, og slår bestillingsknappen fra
    document.querySelector("#total p").textContent = "";
    document.querySelector("#total h3").textContent = "Your cart is empty...";
    HTML.placeOrderBtn.disabled = true;
  } else {
    document.querySelector("#total p").textContent = "DKK " + orderTotal + ",00";
    document.querySelector("#total h3").textContent = "Total";
    HTML.placeOrderBtn.disabled = false;
  }

  //For hver øl der ligger i kurven, kalder vi showOrder
  order.forEach(showOrder);

  //Her gør vi mobilepay klikbar, og viser input til telefonnummer, hvis der bliver klikket
  HTML.mobilePay.addEventListener("click", () => {
    paymentOptionSelected = "mobilepay";
    HTML.counter.classList.remove("selected-option");
    HTML.mobilePay.classList.add("selected-option");
    document.querySelector("#phone > label").className = "show-block";
    document.querySelector("#phone-number").className = "show-block";
    HTML.placeOrderBtn.textContent = "Pay now";
  });

  //Her gør vi pay at counter klikbar, og fjerner input feltet til telefonnummer
  HTML.counter.addEventListener("click", () => {
    paymentOptionSelected = "counter";
    HTML.mobilePay.classList.remove("selected-option");
    HTML.counter.classList.add("selected-option");
    document.querySelector("#phone > label").className = "hide-block";
    document.querySelector("#phone-number").className = "hide-block";
    HTML.placeOrderBtn.textContent = "Place order";
  });
}

function showOrder(orderItem) {
  let klon = HTML.orderItemTemplate.cloneNode(true).content;

  //I showOrder har vi kun øllens navn og antal der er bestilt, så for at skrive den rigtige pris, skal vi finde øllen i vores beerArray
  const beerIndex = beerArray.findIndex((obj) => obj.name === orderItem.name);

  klon.querySelector(".order-item").setAttribute("data-summary-beertype", orderItem.name);
  klon.querySelector(".summary-name").textContent = orderItem.name;
  klon.querySelector(".summary-price").textContent = "DKK " + beerArray[beerIndex].price * orderItem.amount + ",00";

  let quantity = beerArray[beerIndex].amountInOrder;
  let onSummaryPage = true;

  klon.querySelector(".minus").addEventListener("click", () => {
    if (quantity != 0) {
      orderTotal = orderTotal - beerArray[beerIndex].price;
      totalQuantity--;
      quantity--;

      beerArray[beerIndex].amountInOrder = quantity;
      updateOrder(orderItem, quantity, onSummaryPage, beerIndex);
    }
  });

  klon.querySelector(".add").addEventListener("click", () => {
    orderTotal = orderTotal + beerArray[beerIndex].price;
    totalQuantity++;
    quantity++;

    beerArray[beerIndex].amountInOrder = quantity;
    updateOrder(orderItem, quantity, onSummaryPage, beerIndex);
  });

  klon.querySelector(".quantity p").textContent = quantity;

  HTML.orderItemContainer.appendChild(klon);
}

/*Denne funktion modtager beer (som kan være enten objektet fra vores beerArray, eller objektet fra vores order), samt 
quantity, som er det opdaterede antal, onSummaryPage, som fortæller om vi står i kurven eller ej, og øllens index i beerArray */
function updateOrder(beer, quantity, onSummaryPage, beerIndex) {
  //Her bruger vi igen en prototype, for at sikre at vi bruger det rigtige format, til at poste vores ordre
  let orderItem = Object.create(OrderItem);

  orderItem.name = beer.name;
  orderItem.amount = quantity;

  //Her tjekker vi om øllens navn allerede står i arrayet med ordren
  let alreadyInArray = order.some((orderArr) => {
    return orderArr.name === orderItem.name;
  });

  if (alreadyInArray) {
    /*Hvis øllen allerede står i arrayet, skal vi enten fjerne den (hvis der bliver trykket minus og der er én i forvejen),
    eller lægge én til amounten. Derfor skal vi bruge indexet i ordre arrayet, på den respektive øl der bliver trykket på.*/
    const objIndex = order.findIndex((obj) => obj.name === orderItem.name);
    if (quantity === 0) {
      //Hvis quantity er lig med 0, fjerner vi objektet fra arrayet.
      order.splice(objIndex, 1);
    } else {
      //ellers opdaterer vi amounten med den nye quantity.
      order[objIndex].amount = quantity;
    }
  } else {
    //Hvis den ikke allerede står i arrayet, tilføjer vi den prototype vi lavede længere oppe.
    order.push(orderItem);
  }

  //Her skriver vi den korrekte quantity ud i DOM'en, på det rigtige sted.
  document.querySelector(`[data-beertype='${beer.name}']`).querySelector(".quantity p").textContent = quantity;

  //Vi opdaterer her kurven oppe i højre hjørne.
  HTML.totalPrice.textContent = totalQuantity + " - DKK " + orderTotal + ",00";

  //Hvis vi er på summary siden, skriver vi de rigtige data ud i DOM'en.
  if (onSummaryPage) {
    document.querySelector(`[data-summary-beertype='${beer.name}']`).querySelector(".quantity p").textContent = quantity;

    document.querySelector(`[data-summary-beertype='${beer.name}']`).querySelector(".summary-price").textContent = "DKK " + quantity * beerArray[beerIndex].price + ",00";

    document.querySelector("#total p").textContent = "DKK " + orderTotal + ",00";

    if (order.length === 0) {
      document.querySelector("#total p").textContent = "";
      document.querySelector("#total h3").textContent = "Your cart is empty...";
      HTML.placeOrderBtn.disabled = true;
      document.querySelectorAll("input[type='radio']").forEach((radio) => (radio.disabled = true));
    } else {
      document.querySelector("#total p").textContent = "DKK " + orderTotal + ",00";
      document.querySelector("#total h3").textContent = "Total";
      HTML.placeOrderBtn.disabled = false;
      document.querySelectorAll("input[type='radio']").forEach((radio) => (radio.disabled = false));
    }
  } else {
    HTML.totalPrice.classList.add("update_animation");
    HTML.totalPrice.addEventListener("animationend", () => {
      HTML.totalPrice.classList.remove("update_animation");
    });
  }

  console.log(order);
}

function placeOrder() {
  HTML.payment.className = "hide-block";
  HTML.processing.className = "show-block";
  HTML.processing.querySelector("h1").textContent = "Processing order";
  //Vi stringifyer vores ordre, og poster til endpointet med /order bagpå.
  const postData = JSON.stringify(order);

  beerArray.forEach((beer) => {
    beer.inOrder = false;
    beer.amountInOrder = 0;
  });

  totalQuantity = 0;
  orderTotal = 0;
  document.querySelector("#phone-number").value = "";
  HTML.totalPrice.textContent = totalQuantity + " - DKK " + orderTotal + ",00";

  document.querySelectorAll(".quantity p").forEach((q) => (q.textContent = "0"));

  fetch(endPoint + "order", {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: postData,
  })
    .then((e) => e.json())
    .then((e) => {
      console.log(e);

      fetch(endPoint, {
        method: "get",
      })
        .then((newData) => newData.json())
        .then((newData) => {
          const orderID = newData.queue[newData.queue.length - 1].id;
          HTML.orderIDConfirmation.textContent = "Your order number is #" + orderID;

          order.length = 0;
          console.log("Order reset");

          if (paymentOptionSelected === "counter") {
            HTML.processing.className = "hide-block";
            HTML.orderConfirmation.className = "show-block";
            HTML.placeNewOrderBtn.addEventListener("click", () => {
              HTML.main.className = "show-block";
              HTML.payment.className = "hide-block";
              HTML.orderConfirmation.className = "hide-block";
            });
          }
        });
    });

  if (paymentOptionSelected === "mobilepay") {
    HTML.processing.querySelector("h1").textContent = "Waiting for payment";
    setTimeout(() => {
      HTML.processing.className = "hide-block";
      HTML.orderConfirmation.className = "show-block";
      HTML.placeNewOrderBtn.addEventListener("click", () => {
        HTML.main.className = "show-block";
        HTML.payment.className = "hide-block";
        HTML.orderConfirmation.className = "hide-block";
      });
    }, 5000);
  }
}

//Borrowed from https://css-tricks.com/converting-color-spaces-in-javascript/
function darkenHEX(H) {
  // Convert hex to RGB first
  let r = 0,
    g = 0,
    b = 0;
  if (H.length == 4) {
    r = "0x" + H[1] + H[1];
    g = "0x" + H[2] + H[2];
    b = "0x" + H[3] + H[3];
  } else if (H.length == 7) {
    r = "0x" + H[1] + H[2];
    g = "0x" + H[3] + H[4];
    b = "0x" + H[5] + H[6];
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1) - 10;

  return "hsl(" + h + "," + s + "%," + l + "%)";
}
