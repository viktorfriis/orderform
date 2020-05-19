"use strict";
document.addEventListener("DOMContentLoaded", start);

const endPoint = "https://foobarexam.herokuapp.com/";
const order = [];
const beerArray = [];
const HTML = {};
let orderTotal = 0;
let totalQuantity = 0;

const Beer = {
  name: "",
  type: "",
  alc: "",
  price: "",
  desc: "",
  onTap: false,
};

const OrderItem = {
  name: "",
  amount: null,
};

function start() {
  console.log("START");
  document.querySelector(".place_order").addEventListener("click", () => {
    placeOrder(order);
  });

  HTML.totalPrice = document.querySelector("#cart_container p");
  HTML.totalPrice.textContent = totalQuantity + " - DKK " + orderTotal + ",00";
  HTML.template = document.querySelector("template");
  HTML.dest = document.querySelector("main");

  fetchBeers();
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
          cleanData(data, dataBar);
        });
    });
}

function cleanData(data, dataBar) {
  console.log(data);
  console.log(dataBar);

  data.forEach((beer) => {
    let beerItem = Object.create(Beer);
    const beerNumber = data.indexOf(beer);

    let onTap = dataBar.taps.some((tap) => {
      return tap.beer === data[beerNumber].name;
    });

    beerItem.name = data[beerNumber].name;
    beerItem.type = data[beerNumber].category;
    beerItem.alc = data[beerNumber].alc;
    beerItem.price = 45;
    beerItem.desc = data[beerNumber].description.overallImpression;
    beerItem.onTap = onTap;

    beerArray.push(beerItem);
  });

  const sortedArray = beerArray.sort(function (a, b) {
    return b.onTap - a.onTap;
  });

  console.log(sortedArray);

  sortedArray.forEach((beer) => showBeer(beer));
  fetchSVGS();
}

function showBeer(beer) {
  let klon = HTML.template.cloneNode(true).content;

  klon.querySelector(".beer").setAttribute("data-beertype", beer.name);
  klon.querySelector(".name").textContent = beer.name;
  klon.querySelector(".type").textContent = beer.type + " - " + beer.alc + "%";
  klon.querySelector(".price").textContent = "DKK " + beer.price + ",00";
  klon.querySelector(".infobox p").textContent = beer.desc;

  klon.querySelector(".info-icon").addEventListener("click", () => {
    klon.querySelector(".infobox").classList.add("show");
  });

  if (beer.onTap) {
    let quantity = 0;

    klon.querySelector(".minus").addEventListener("click", () => {
      if (quantity != 0) {
        orderTotal = orderTotal - beer.price;
        totalQuantity--;
        quantity--;
        updateOrder(beer.name, quantity);
      }
    });

    klon.querySelector(".add").addEventListener("click", () => {
      orderTotal = orderTotal + beer.price;
      totalQuantity++;
      quantity++;
      updateOrder(beer.name, quantity);
    });

    klon.querySelector(".quantity p").textContent = quantity;
  } else {
    klon.querySelector(".quantity").style.display = "none";
    klon.querySelector(".price").textContent = "Not on tap right now";
  }

  HTML.dest.appendChild(klon);
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

function updateOrder(beerName, quantity) {
  let orderItem = Object.create(OrderItem);

  orderItem.name = beerName;
  orderItem.amount = quantity;

  let alreadyInArray = order.some((orderArr) => {
    return orderArr.name === orderItem.name;
  });

  if (alreadyInArray) {
    const objIndex = order.findIndex((obj) => obj.name === orderItem.name);

    if (quantity === 0) {
      order.splice(objIndex, 1);
    } else {
      order[objIndex].amount = quantity;
    }
  } else {
    order.push(orderItem);
  }

  console.log(alreadyInArray);

  console.log(order);

  document
    .querySelector(`[data-beertype='${beerName}']`)
    .querySelector(".quantity p").textContent = quantity;

  console.log(orderTotal);
  //   HTML.totalPrice.textContent = totalQuantity;
  HTML.totalPrice.textContent = totalQuantity + " - DKK " + orderTotal + ",00";
  //   HTML.totalPrice.textContent =
  //     totalQuantity + " beers in cart - DKK " + orderTotal + ",00";
}

function placeOrder(order) {
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
