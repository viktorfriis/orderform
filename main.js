"use strict";
document.addEventListener("DOMContentLoaded", start);

const endPoint = "https://foobarexam.herokuapp.com/";
const order = [];

const OrderItem = {
  name: "",
  amount: null,
};

function start() {
  console.log("START");
  document.querySelector(".place_order").addEventListener("click", () => {
    placeOrder(order);
  });

  fetchSVGS();
  fetchData();
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

function fetchData() {
  fetch(endPoint + "beertypes", {
    method: "get",
  })
    .then((data) => data.json())
    .then((data) => {
      showData(data);
    });
}

function showData(data) {
  console.log(data);
  data.forEach((beer) => {
    const beerNumber = data.indexOf(beer);
    const DOMDest = document.querySelector(
      `main article:nth-child(${beerNumber + 1})`
    );

    DOMDest.setAttribute("data-beertype", data[beerNumber].name);
    DOMDest.querySelector(".name").textContent = data[beerNumber].name;
    DOMDest.querySelector(".type").textContent =
      data[beerNumber].category + " - " + data[beerNumber].alc + "%";
    DOMDest.querySelector(".price").textContent = "DKK 35,00";
    DOMDest.querySelector(".info").textContent =
      data[beerNumber].description.overallImpression;

    let quantity = 0;

    DOMDest.querySelector(".minus").addEventListener("click", () => {
      quantity--;
      updateOrder(data[beerNumber].name, quantity);
    });

    DOMDest.querySelector(".add").addEventListener("click", () => {
      quantity++;
      updateOrder(data[beerNumber].name, quantity);
    });

    DOMDest.querySelector(".quantity p").textContent = quantity;
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

    order[objIndex].amount = quantity;
  } else {
    order.push(orderItem);
  }

  console.log(alreadyInArray);

  console.log(order);

  document
    .querySelector(`[data-beertype='${beerName}']`)
    .querySelector(".quantity p").textContent = quantity;
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
