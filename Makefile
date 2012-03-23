CACHEFILE=courses.cache.py

all: processreqs.py model.py data.db
	python processreqs.py major_reqs assets/major_reqs

$(CACHEFILE): scraper.py
	python scraper.py $(CACHEFILE)

data.db: $(CACHEFILE) makedb.py
	python makedb.py $(CACHEFILE)
