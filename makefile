all: database majorreqs

majorreqs:
	python processreqs.py ./major_reqs ../frontend/major_reqs # expand reqs, stage them to be served

database: courses.py
	python model.py # delete db, create tables
	python scraper.py # scrape course data, insert into db
