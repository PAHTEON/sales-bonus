/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //не менять параметры
    // @TODO: Расчет выручки от операции
    return purchase.count * _product.price;

}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { //не менять параметры
    // @TODO: Расчет бонуса от позиции в рейтинге
    const coef = (total - index) / total;
    return seller.profit * coef;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) { //не менять параметры
    // @TODO: Проверка входных данных
    if (!data || !Array.isArray(data.purchases) || !Array.isArray(data.products) || !Array.isArray(data.sellers)) {
        return [];
    }

    const { purchases, products, sellers } = data;



    // @TODO: Проверка наличия опций
    // @TODO: Подготовка промежуточных данных для сбора статистики


    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const productById = {};
    const sellerById = {};

    for (const p of products) productById[p.product_id] = p;
    for (const s of sellers) sellerById[s.seller_id] = {...s, revenue: 0, profit: 0, sales_count: 0, top_products: {} };

    // @TODO: Расчет выручки и прибыли для каждого продавца
    for (const purchase of purchases) {
        const s = sellerById[purchase.seller_id];
        const pr = productById[purchase.product_id];

        if (!s || !pr) continue;

        const revenue = calculateSimpleRevenue(purchase, pr);
        const profit = revenue - pr.prime_cost * purchase.count;

        s.revenue += revenue;
        s.profit += profit;
        s.sales_count += purchase.count;
        s.top_products[purchase.product_id] = (s.top_products[purchase.product_id] || 0) + purchase.count;
    }

    for (const s of Object.values(sellerById)) {
        s.top_products = Object.entries(s.top_products)
            .map(([product_id, count]) => ({
                product_id: Number(product_id),
                sales_count: count
            }))
            .sort((a, b) => b.sales_count - a.sales_count);
    }




    // @TODO: Сортировка продавцов по прибыли
    const sorted = Object.values(sellerById).sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    for (let i = 0; i < sorted.length; i++) {
        sorted[i].bonus = calculateBonusByProfit(i + 1, sorted.length, sorted[i]);
    }

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sorted.map(s => ({
        seller_id: s.seller_id,
        name: s.name,
        revenue: s.revenue,
        profit: s.profit,
        bonus: s.bonus,
        sales_count: s.sales_count,
        top_products: s.top_products
    }));