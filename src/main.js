/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //не менять параметры
    // @TODO: Расчет выручки от операции
    const quantity = Number(purchase.count ? ? 0);
    const price = Number(_product.price ? ? 0);
    return +(quantity * price).toFixed(2);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { //не менять параметры
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (total === 0) return 0;
    const bonus = (seller.profit / total) * 1000; // лидер получает 1000
    return +bonus.toFixed(2);
}


/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) { //не менять параметры
    // @TODO: Проверка входных данных
    const { sellers, products, purchase_records } = data;

    if (!Array.isArray(sellers) || !sellers.length) throw new Error('Нет данных о продавцах');
    if (!Array.isArray(products) || !products.length) throw new Error('Нет данных о товарах');
    if (!Array.isArray(purchase_records) || !purchase_records.length) throw new Error('Нет данных о покупках');

    const productsMap = Object.fromEntries(products.map(p => [p.id, p]));

    const results = sellers.map(seller => {
        const sellerPurchases = purchase_records.filter(p => p.seller_id === seller.id);

        let revenue = 0;
        let sales_count = 0;
        const productSales = {};

        sellerPurchases.forEach(purchase => {
            const product = productsMap[purchase.product_id];
            if (!product) return;

            const saleRevenue = calculateSimpleRevenue(purchase, product);
            revenue += saleRevenue;
            sales_count += purchase.count ? ? 0;

            if (!productSales[product.name]) productSales[product.name] = 0;
            productSales[product.name] += purchase.count ? ? 0;
        });




        const top_products = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);



        return {
            seller_id: seller.id,
            name: seller.name,
            revenue: +revenue.toFixed(2),
            sales_count,
            top_products,
            profit: +revenue.toFixed(2),
            bonus: 0
        };
    });

    const maxProfit = Math.max(...results.map(r => r.profit));
    results.forEach((r, i) => {
        r.bonus = calculateBonusByProfit(i, maxProfit, r);
    });

    return results;
}

// @TODO: Расчет выручки и прибыли для каждого продавца

// @TODO: Сортировка продавцов по прибыли


// @TODO: Назначение премий на основе ранжирования

// @TODO: Подготовка итоговой коллекции с нужными полями