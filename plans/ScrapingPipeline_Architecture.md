# ScrapingPipeline.js Architecture Design

## Overview
The ScrapingPipeline.js is a server-side Node.js module responsible for continuous image ingestion from museum APIs, content moderation, and data processing to expand the art history dataset beyond the current 500 static images.

## Requirements
- Integrate with museum APIs: Metropolitan Museum of Art, Smithsonian Institution, Louvre, etc.
- Implement content moderation to filter inappropriate or non-human-mark content
- Process scraped data into the standard format compatible with ImageLoader.js
- Support continuous ingestion with scheduling
- Handle rate limiting and API constraints
- Ensure data quality and attribution

## Architecture Components

### 1. ScrapingPipeline Class
Main orchestrator class that coordinates all scraping activities.

```javascript
class ScrapingPipeline {
  constructor(config) {
    this.apis = [];
    this.moderator = new ContentModerator(config.moderation);
    this.processor = new DataProcessor();
    this.storage = new DataStorage(config.database);
    this.scheduler = new IngestionScheduler(config.schedule);
  }

  async initialize() {
    // Initialize API clients
    this.apis.push(new MetMuseumAPI());
    this.apis.push(new SmithsonianAPI());
    this.apis.push(new LouvreAPI());
    // Add more APIs as needed
  }

  async runIngestionCycle() {
    for (const api of this.apis) {
      try {
        const rawData = await api.scrape();
        const moderatedData = await this.moderator.moderate(rawData);
        const processedData = this.processor.process(moderatedData);
        await this.storage.save(processedData);
      } catch (error) {
        console.error(`Error scraping ${api.name}:`, error);
      }
    }
  }
}
```

### 2. API Client Classes
Abstract base class and specific implementations for each museum API.

```javascript
class BaseMuseumAPI {
  constructor() {
    this.name = 'Base Museum';
    this.baseUrl = '';
    this.rateLimit = 1000; // ms between requests
  }

  async scrape() {
    // Implement in subclasses
    return [];
  }

  async makeRequest(endpoint) {
    // Rate limiting and error handling
  }
}

class MetMuseumAPI extends BaseMuseumAPI {
  constructor() {
    super();
    this.name = 'Metropolitan Museum of Art';
    this.baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';
  }

  async scrape() {
    // Search for objects with images, filter for human marks
    const searchTerms = ['painting', 'sculpture', 'drawing', 'print'];
    const results = [];

    for (const term of searchTerms) {
      const response = await this.makeRequest(`/search?hasImages=true&q=${term}`);
      // Process results
    }

    return results;
  }
}
```

### 3. ContentModerator Class
Handles AI-based and human review moderation.

```javascript
class ContentModerator {
  constructor(config) {
    this.aiModel = new AIModerator(config.ai);
    this.humanQueue = new HumanReviewQueue();
    this.filters = config.filters;
  }

  async moderate(rawData) {
    const moderated = [];

    for (const item of rawData) {
      // Basic filtering
      if (!this.passesBasicFilters(item)) continue;

      // AI moderation
      const aiResult = await this.aiModel.analyze(item);
      if (aiResult.confidence > 0.8) {
        if (aiResult.isApproved) {
          moderated.push(item);
        } else {
          await this.humanQueue.add(item);
        }
      } else {
        await this.humanQueue.add(item);
      }
    }

    return moderated;
  }

  passesBasicFilters(item) {
    // Check for required fields, image quality, etc.
    return item.imageUrl && item.title && item.date;
  }
}
```

### 4. DataProcessor Class
Transforms raw API data into the standard format.

```javascript
class DataProcessor {
  constructor() {
    this.classifier = new ImageClassifier();
  }

  async process(rawItems) {
    const processed = [];

    for (const item of rawItems) {
      const processedItem = {
        id: this.generateId(item),
        url: item.imageUrl,
        position: this.calculatePosition(item), // Or defer to arrangement algorithm
        era: this.parseEra(item.date),
        region: this.parseRegion(item),
        colors: await this.classifier.extractColors(item.imageUrl),
        type: this.classifyMarkType(item),
        source: item.source,
        confidence: item.confidence || 1.0
      };

      processed.push(processedItem);
    }

    return processed;
  }

  generateId(item) {
    return `museum_${item.source}_${item.objectId}`;
  }

  calculatePosition(item) {
    // For now, random position; later integrate with arrangement algorithm
    return [
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 40
    ];
  }
}
```

### 5. DataStorage Class
Handles persistence to database.

```javascript
class DataStorage {
  constructor(config) {
    this.db = new MongoClient(config.uri);
    this.collection = this.db.collection('images');
  }

  async save(items) {
    // Bulk insert with duplicate handling
    const operations = items.map(item => ({
      updateOne: {
        filter: { id: item.id },
        update: { $set: item },
        upsert: true
      }
    }));

    await this.collection.bulkWrite(operations);
  }

  async getAll() {
    return await this.collection.find({}).toArray();
  }
}
```

### 6. IngestionScheduler Class
Manages timing of ingestion cycles.

```javascript
class IngestionScheduler {
  constructor(config) {
    this.interval = config.interval || 24 * 60 * 60 * 1000; // Daily
    this.isRunning = false;
  }

  start(pipeline) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.scheduleNext(pipeline);
  }

  scheduleNext(pipeline) {
    setTimeout(async () => {
      await pipeline.runIngestionCycle();
      if (this.isRunning) {
        this.scheduleNext(pipeline);
      }
    }, this.interval);
  }

  stop() {
    this.isRunning = false;
  }
}
```

## Integration with Existing System

### ImageLoader.js Modifications
Update ImageLoader to load from database instead of static JSON:

```javascript
// In ImageLoader.js
async loadFromDatabase() {
  const response = await fetch('/api/images');
  const images = await response.json();
  // Process as before
}
```

### API Endpoints
Add Express routes for data access:

```javascript
// server.js
app.get('/api/images', async (req, res) => {
  const images = await storage.getAll();
  res.json(images);
});
```

## Error Handling and Resilience
- Rate limiting per API
- Retry logic for failed requests
- Logging and monitoring
- Graceful degradation when APIs are down

## Performance Considerations
- Batch processing of items
- Concurrent API calls with limits
- Caching of API responses
- Incremental updates to avoid full rescraping

## Security and Ethics
- Respect API terms of service
- Proper attribution
- Content warnings for sensitive material
- Data privacy compliance

## Future Enhancements
- Machine learning for better mark type classification
- User-submitted content pipeline
- Real-time ingestion triggers
- Advanced content moderation with human-in-the-loop