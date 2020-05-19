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
  fetch(endPoint + "beertypes", {
    method: "get",
  })
    .then((data) => data.json())
    .then((data) => {
      fetch(endPoint, {
        method: "get",
      })
        .then((dataBar) => dataBar.json())
        .then((dataBar) => {
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
              cleanData(data, dataBar, restDBData);
            });
        });
    });
}

function cleanData(data, dataBar, restDBData) {
  data.forEach((beer) => {
    let beerItem = Object.create(Beer);
    const beerIndexPop = restDBData.findIndex((obj) => obj.name === beer.name);

    let onTap = dataBar.taps.some((tap) => {
      return tap.beer === beer.name;
    });

    beerItem.name = beer.name;
    beerItem.type = beer.category;
    beerItem.alc = beer.alc;
    beerItem.price = beerPrice;
    beerItem.desc = beer.description.overallImpression;
    beerItem.onTap = onTap;
    beerItem.popularity = restDBData[beerIndexPop].popularity;

    beerArray.push(beerItem);
  });

  const sortedArray = beerArray.sort(function (a, b) {
    if (a.onTap > b.onTap) return -1;
    if (a.onTap < b.onTap) return 1;

    if (b.popularity > a.popularity) return 1;
    if (b.popularity < a.popularity) return -1;
  });

  console.log(sortedArray);

  sortedArray.forEach((beer) => showBeer(beer));
  fetchSVGS();
}

function showBeer(beer) {
  let klon = HTML.mainTemplate.cloneNode(true).content;

  klon.querySelector(".beer").setAttribute("data-beertype", beer.name);
  klon.querySelector(".name").textContent = beer.name;
  klon.querySelector(".type").textContent = beer.type + " - " + beer.alc + "%";
  klon.querySelector(".price").textContent = "DKK " + beer.price + ",00";
  klon.querySelector(".infobox p").textContent = beer.desc;

  klon.querySelector(".info-icon").addEventListener("click", () => {
    klon.querySelector(".infobox").classList.add("show");
  });

  let summary = false;
  let quantity = 0;

  if (beer.onTap) {
    klon.querySelector(".minus").addEventListener("click", () => {
      quantity = beer.amountInOrder;
      if (quantity != 0) {
        orderTotal = orderTotal - beer.price;
        totalQuantity--;
        quantity--;
        beer.amountInOrder = quantity;
        updateOrder(beer.name, quantity, summary);
      }
    });

    klon.querySelector(".add").addEventListener("click", () => {
      quantity = beer.amountInOrder;
      orderTotal = orderTotal + beer.price;
      totalQuantity++;

      beer.inOrder = true;
      quantity++;
      beer.amountInOrder = quantity;
      updateOrder(beer.name, quantity, summary);
    });

    klon.querySelector(".quantity p").textContent = quantity;
  } else {
    klon.querySelector(".quantity").style.display = "none";
    klon.querySelector(".price").textContent = "Not on tap right now";
  }

  HTML.main.appendChild(klon);
}

function fetchSVGS() {
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

function updateOrder(beerName, quantity, summary) {
  let orderItem = Object.create(OrderItem);

  orderItem.name = beerName;
  orderItem.amount = quantity;

  let alreadyInArray = order.some((orderArr) => {
    return orderArr.name === orderItem.name;
  });

  const objIndex = order.findIndex((obj) => obj.name === orderItem.name);

  if (alreadyInArray) {
    if (quantity === 0) {
      order.splice(objIndex, 1);
    } else {
      order[objIndex].amount = quantity;
    }
  } else {
    order.push(orderItem);
  }

  document
    .querySelector(`[data-beertype='${beerName}']`)
    .querySelector(".quantity p").textContent = quantity;

  HTML.totalPrice.textContent = totalQuantity + " - DKK " + orderTotal + ",00";

  if (summary) {
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
