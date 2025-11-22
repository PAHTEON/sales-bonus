/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //не менять параметры
    if (!purchase || !_product) return 0;
    // @TODO: Расчет выручки от операции
    const quantity = Number(purchase.quantity) || 0;
    const salePrice = Number(_product.sale_price) || 0;
    const discount = Number(purchase.discount) || 0;

    return quantity * salePrice * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { //не менять параметры
    if (!seller || total <= 1) return 0;
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0) return seller.profit * 0.15;
    if (index === 1 || index === 2) return seller.profit * 0.10;
    if (index === total - 1) return 0;
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
    if (!data || !Array.isArray(data.sellers) || !Array.isArray(data.products) || !Array.isArray(data.purchase_records)) {
        throw new Error("Некорректные входные данные");
    }

    // @TODO: Проверка наличия опций
    if (!options) throw new Error("Отсутствуют опции");
    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
        throw new Error("Опции должны содержать calculateRevenue и calculateBonus");
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sale_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.seller_id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const revenue = calculateRevenue(item, product);
            const cost = item.quantity * product.purchase_price;
            const profit = revenue - cost;
            seller.revenue += revenue;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) seller.products_sold[item.sku] = 0;
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    const sortedSellers = sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sortedSellers.forEach((seller, index) => {
        seller.bonus = +calculateBonus(index, sortedSellers.length, seller).toFixed(2);

        seller.top_products = Object.entries(seller.products_sold).map(([sku, quantity]) => ({ sku, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sortedSellers.map(s => ({
        seller_id: s.seller_id,
        name: s.name,
        revenue: +s.revenue.toFixed(2),
        profit: +s.profit.toFixed(2),
        sales_count: s.sales_count,
        top_products: s.top_products,
        bonus: s.bonus
    }));
}