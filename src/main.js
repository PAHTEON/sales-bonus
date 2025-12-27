/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //не менять параметры
    const discountMultiplier = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discountMultiplier;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { //не менять параметры
    // @TODO: Расчет бонуса от позиции в рейтинге
    const profit = seller.profit;
    let bonus = 0;

    if (index === 0) bonus = profit * 0.15;
    else if (index === 1 || index === 2) bonus = profit * 0.10;
    else if (index === total - 1) bonus = 0;
    else bonus = profit * 0.05;

    return Math.round(bonus * 100) / 100;
}


/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!data || typeof data !== 'object') throw new Error('Некорректные входные данные');
    if (!Array.isArray(data.sellers) || data.sellers.length === 0) throw new Error('Некорректные входные данные');
    if (!Array.isArray(data.products) || data.products.length === 0) throw new Error('Некорректные входные данные');
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) throw new Error('Некорректные входные данные');

    if (!options || typeof options !== 'object') throw new Error('Некорректные опции');
    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Опции должны содержать функции calculateRevenue и calculateBonus');
    }

    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenueMilli: 0,
        profitMilli: 0,
        sales_count: 0,
        products_sold: {}
    }));

    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.seller_id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;
        seller.sales_count += 1;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const revenueMilli = Math.round(calculateRevenue(item, product) * 1000);
            const costMilli = Math.round(product.purchase_price * item.quantity * 1000);
            const profitMilli = revenueMilli - costMilli;

            seller.revenueMilli += revenueMilli;
            seller.profitMilli += profitMilli;
            seller.products_sold[item.sku] = (seller.products_sold[item.sku] || 0) + item.quantity;
        });
    });

    sellerStats.sort((a, b) => b.profitMilli - a.profitMilli);
    const totalSellers = sellerStats.length;

    sellerStats.forEach((seller, index) => {
        const profit = seller.profitMilli / 1000;
        const bonus = calculateBonus(index, totalSellers, {...seller, profit });

        seller.revenue = seller.revenueMilli / 1000;
        seller.profit = profit;
        seller.bonus = Math.round(bonus * 100) / 100; // бонус оставляем с двумя знаками

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        delete seller.products_sold;
        delete seller.revenueMilli;
        delete seller.profitMilli;
    });

    return sellerStats;
}

return {
    calculateSimpleRevenue,
    calculateBonusByProfit,
    analyzeSalesData
};