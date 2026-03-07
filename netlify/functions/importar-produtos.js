exports.handler = async function(event) {

  try {

    const query = event.queryStringParameters.q || "ofertas";

    const response = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}`);

    const data = await response.json();

    const products = data.results.slice(0,10).map(item => ({
      id: item.id,
      name: item.title,
      price: item.price,
      image: item.thumbnail,
      link: item.permalink
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(products)
    };

  } catch(error) {

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };

  }

};