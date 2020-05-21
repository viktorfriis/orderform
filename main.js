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
let beerPrice = 35;

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

  HTML.cart = document.querySelector("#cart_container");
  HTML.logo = document.querySelector("#logo");

  HTML.cart.addEventListener("click", () => {
    HTML.main.classList.add("hide-block");
    HTML.main.classList.remove("show-block");

    HTML.payment.classList.add("show-block");
    HTML.payment.classList.remove("hide-block");

    createSummary();
  });

  HTML.logo.addEventListener("click", () => {
    HTML.main.classList.remove("hide-block");
    HTML.main.classList.add("show-block");

    HTML.payment.classList.remove("show-block");
    HTML.payment.classList.add("hide-block");
  });

  fetchBeers();
}

function createSummary() {
  HTML.orderItemContainer.innerHTML = "";
  document.querySelector("#total p").textContent = "DKK " + orderTotal + ",00";

  HTML.placeOrderBtn.addEventListener("click", placeOrder);
  order.forEach(showOrder);
}

function showOrder(orderItem) {
  let klon = HTML.orderItemTemplate.cloneNode(true).content;
  const beerIndex = beerArray.findIndex((obj) => obj.name === orderItem.name);

  klon
    .querySelector(".order-item")
    .setAttribute("data-summary-beertype", orderItem.name);
  klon.querySelector(".summary-name").textContent = orderItem.name;
  klon.querySelector(".summary-price").textContent =
    "DKK " + beerPrice * orderItem.amount + ",00";

  let quantity = beerArray[beerIndex].amountInOrder;
  let summary = true;

  klon.querySelector(".minus").addEventListener("click", () => {
    if (quantity != 0) {
      orderTotal = orderTotal - beerPrice;
      totalQuantity--;
      quantity--;

      beerArray[beerIndex].amountInOrder = quantity;
      updateOrder(orderItem.name, quantity, summary);
    }
  });

  klon.querySelector(".add").addEventListener("click", () => {
    orderTotal = orderTotal + beerPrice;
    totalQuantity++;
    quantity++;

    beerArray[beerIndex].amountInOrder = quantity;
    updateOrder(orderItem.name, quantity, summary);
  });

  klon.querySelector(".quantity p").textContent = quantity;

  HTML.orderItemContainer.appendChild(klon);
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
    beerItem.price = beerPrice;
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
    beerItem.popularity = restDBData[beerIndexPop].popularity;

    //Til sidst tilføjer vi hver øl til vores lokale array beerArray.
    beerArray.push(beerItem);
  });

  /*beerArray bliver her sorteret. Først efter om øllene er på tap eller ej. Alle dem der ikke er på tap, bliver 
  vist til sidst. Herefter sorterer vi på popularitet.
  https://gomakethings.com/sorting-an-array-by-multiple-criteria-with-vanilla-javascript/*/
  const sortedArray = beerArray.sort(function (a, b) {
    if (a.onTap > b.onTap) return -1;
    if (a.onTap < b.onTap) return 1;

    if (b.popularity > a.popularity) return 1;
    if (b.popularity < a.popularity) return -1;
  });

  console.log(sortedArray);

  //For hver øl i vores sorterede array kører vi funktionen showBeer, som skriver øllen ud i DOM'en.
  sortedArray.forEach((beer) => showBeer(beer));
  fetchSVGS();
}

function showBeer(beer) {
  //Vi laver en klon af vores template, som vi har lavet i HTML'en
  let klon = HTML.mainTemplate.cloneNode(true).content;

  //Klonen fylder vi så ud med de relevante info fra vores beerArray
  klon.querySelector(".beer").setAttribute("data-beertype", beer.name);
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
        updateOrder(beer.name, quantity, onSummaryPage);
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
      updateOrder(beer.name, quantity, onSummaryPage);
    });

    klon.querySelector(".quantity p").textContent = quantity;
  } else {
    //Hvis øllen IKKE er på tap, fjerner vi plus minus fra DOM'en, og skriver at den ikke er på tap.
    klon.querySelector(".quantity").style.display = "none";
    klon.querySelector(".price").textContent = "Not on tap right now";
  }

  //Til sidst appender vi hver klon i vores main tag.
  HTML.main.appendChild(klon);
}

function toggleInfo(beer) {
  document
    .querySelector(`[data-beertype='${beer}']`)
    .classList.toggle("info-open");
}

function fetchSVGS() {
  //Her henter vi SVG overlayet til hver øl i DOM'en.
  fetch("svgs/overlay.svg", {
    method: "get",
  })
    .then((svg) => svg.text())
    .then((svg) => {
      document
        .querySelectorAll(".overlay_container")
        .forEach((beer) => (beer.innerHTML = svg));
    });
}

function updateOrder(beerName, quantity, onSummaryPage) {
  //Her bruger vi igen en prototype, for at sikre at vi bruger det rigtige format, til at poste vores ordre
  let orderItem = Object.create(OrderItem);

  orderItem.name = beerName;
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
  document
    .querySelector(`[data-beertype='${beerName}']`)
    .querySelector(".quantity p").textContent = quantity;

  //Vi opdaterer her kurven oppe i højre hjørne.
  HTML.totalPrice.textContent = totalQuantity + " - DKK " + orderTotal + ",00";

  //Hvis vi er på summary siden, skriver vi de rigtige data ud i DOM'en.
  if (onSummaryPage) {
    document
      .querySelector(`[data-summary-beertype='${beerName}']`)
      .querySelector(".quantity p").textContent = quantity;

    document
      .querySelector(`[data-summary-beertype='${beerName}']`)
      .querySelector(".summary-price").textContent =
      "DKK " + quantity * beerPrice + ",00";

    document.querySelector("#total p").textContent =
      "DKK " + orderTotal + ",00";
  }

  console.log(order);
}

function placeOrder() {
  //Vi stringifyer vores ordre, og poster til endpointet med /order bagpå.
  const postData = JSON.stringify(order);

  fetch(endPoint + "order", {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: postData,
  })
    .then((e) => e.json())
    .then((e) => console.log(e));
}
