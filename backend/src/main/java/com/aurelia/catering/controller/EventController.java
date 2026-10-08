

import com.aurelia.catering.dao.EventDao;
import com.aurelia.catering.model.Event;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Event Management.
 * Base URL: /api/events
 */
@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private EventDao eventDao;

    // GET /api/events
    @GetMapping
    public List<Event> getAllEvents() {
        return eventDao.getAllEvents();
    }

    // GET /api/events/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable("id") int id) {
        Event event = eventDao.getEventById(id);
        if (event == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(event);
    }

    // GET /api/events/order/{orderId}
    @GetMapping("/order/{orderId}")
    public ResponseEntity<Event> getEventByOrderId(@PathVariable("orderId") int orderId) {
        Event event = eventDao.getEventByOrderId(orderId);
        if (event == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(event);
    }

    // POST /api/events
    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Event event) {
        if (event.getOrderId() == null || event.getOrderId() <= 0) {
            return ResponseEntity.badRequest().body("Valid OrderID is required.");
        }
        Event created = eventDao.createEvent(event);
        return ResponseEntity.ok(created);
    }

    // PUT /api/events/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable("id") int id, @RequestBody Event event) {
        Event existing = eventDao.getEventById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        event.setEventId(id);
        Event updated = eventDao.updateEvent(event);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/events/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable("id") int id) {
        Event existing = eventDao.getEventById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        eventDao.deleteEvent(id);
        return ResponseEntity.ok().build();
    }
}
