ER DIAGRAM <- make into hyperlink
-

**Database Design**

CATEGORIES
- category_name (primary key)
Note: Duplicate categories will not be allowed and a category (DEFAULT) will be created when trying to add an entry with no category. 

BUDGETS
- category_name (primary key 1/2)
- month and year (primary key 2/2)
- budget
Note: Budgets will carry over to the next month until manually changed.


EXPENDITURES
- entry_id (primary key, auto-generated)
- category_name (foreign key)
- amount_spent
- date
- note (optional)


show expenditures by month, date, or year
- gives overall total spent
- gives total spent in each category and how much was over or under the budget
  
