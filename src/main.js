/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //не менять параметры
    if (!purchase || typeof purchase !== 'object') return 0;
    // @TODO: Расчет выручки от операции
    const quantity = Number(purchase.quantity) || 0;
    const salePrice = Number(purchase.sale_price) || 0;
    const discount = Number(purchase.discount) || 0;
    const finalPrice = salePrice * (1 - discount);

    return quantity * finalPrice;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { //не менять параметры
    if (!seller || typeof seller.profit !== "number") return 0;
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (total === 1) return 0;
    if (index === 0) return seller.profit * 0.15;
    if (index === 1 || total - 1) return 0;
    if (index === 1 || index === 2) return seller.profit * 0.10;
    return seller.profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) { //не менять параметры
    // @TODO: Проверка входных данных
    if (!data || typeof data !== 'object') {
        throw new Error("Некорректные входные данные");
    }

    if (!options || typeof options !== 'object') {
        throw new Error("Некорректные входные данные");
    }

    if (!Array.isArray(data.sellers) || data.sellers.length === 0)
        throw new Error("Некорректные входные данные");

    if (!Array.isArray(data.products) || data.products.length === 0)
        throw new Error("Некорректные входные данные");

    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0)
        throw new Error("Некорректные входные данные");

    // @TODO: Проверка наличия опций
    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerMap = new Map();
    data.sellers.forEach(s => {
        sellerMap.set(s.seller_id, {
            ...s,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            top_products: {}
        });
    });

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const productMap = new Map();
    data.products.forEach(p => productMap.set(p.product_id, p));


    // @TODO: Расчет выручки и прибыли для каждого продавца
    for (const record of data.purchase_records) {
        const seller = sellerMap.get(record.seller_id);
        if (!seller) continue;

        for (const item of record.items) {
            const product = productMap.get(item.product_id);
            if (!product) continue;

            const revenue = calculateSimpleRevenue(item, product);
            seller.revenue += itemRevenue;

            const profit = (Number(item.sale_price) * (1 - Number(item.discount))) - Number(product.purchase_price);
            seller.profit += profit * Number(item.quantity);


            seller.sales_count += Number(item.quantity);

            seller.top_products[item.product_id] = (seller.top_products[item.product_id] || 0) + Number(item.quantity);
        }
    }






    // @TODO: Сортировка продавцов по прибыли
    const sortedSellers = [...sellerMap.values()].sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sortedSellers.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sortedSellers.length, seller);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sortedSellers.map(s => ({
        seller_id: s.seller_id,
        name: s.name,
        revenue: s.revenue,
        profit: s.profit,
        bonus: s.bonus,
        sales_count: s.sales_count,
        top_products: s.top_products

    }));
}

module.exports = {
    calculateSimpleRevenue,
    calculateBonusByProfit,
    analyzeSalesData
};