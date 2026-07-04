export function BrokenCard() {
  return (
    <div>
      <img src="/product.png" />
      <div onClick={() => alert("added")}>Add to cart</div>
      <input type="text" placeholder="Quantity" />
      <a href="/details">click here</a>
    </div>
  );
}
