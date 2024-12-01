function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function parseValue(item) {
  if (typeof item !== 'object') return item
  for (let key of Object.keys(item)) {
    let val = item[key];
    if (typeof val == "bigint") {
      val = Number(val);
    }
    if (typeof val == "object") {
      switch (val.constructor.name) {
        case "Uint8Array":
          const blob = new Blob([val]);
          val = await blobToBase64(blob);
          break;
        case "Array":
          val = await parseValues(val);
          break;
        default:
          break;
      }
    }
    item[key] = val;
  }
  return item;
}

export async function parseValues(items) {
  return Promise.all(
    items.map(async (item) => {
      return parseValue(item);
    })
  );
}
