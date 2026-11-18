package com.reservaya.service;

import com.reservaya.dto.ProductPageResponse;
import com.reservaya.dto.SearchDtos.Suggestion;
import com.reservaya.model.Category;
import com.reservaya.model.Product;
import com.reservaya.repository.CategoryRepository;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.*;

/**
 * Historia #22: busqueda por texto y rango de fechas, ordenada por relevancia, y sugerencias de autocompletado.
 *
 * Relevancia: cada palabra buscada debe aparecer en el nombre, la categoria, la ubicacion o la descripcion (sin distinguir
 * mayusculas ni tildes). Pesa mas una coincidencia en el nombre (sobre todo al inicio de una palabra) que en la
 * categoria, y esta mas que en la descripcion. Con fechas, se excluyen los productos reservados en ese rango.
 * El filtrado se hace en memoria: es suficiente para el volumen del MVP.
 */
@Service
public class ProductSearchService {

    private static final int MAX_SUGGESTIONS = 8;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ReservationRepository reservationRepository;

    public ProductSearchService(ProductRepository productRepository,
                                CategoryRepository categoryRepository,
                                ReservationRepository reservationRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public ProductPageResponse search(String query, LocalDate checkIn, LocalDate checkOut,
                                      Collection<Long> categoryIds, int page, int size) {
        validateDates(checkIn, checkOut);
        List<String> tokens = tokenize(query);
        Set<Long> booked = checkIn != null
                ? reservationRepository.findBookedProductIds(checkIn, checkOut)
                : Set.of();
        boolean filterCategories = categoryIds != null && !categoryIds.isEmpty();

        List<Product> all = productRepository.findAll();
        List<Scored> matches = new ArrayList<>();
        for (Product product : all) {
            if (booked.contains(product.getId())) {
                continue;
            }
            if (filterCategories && (product.getCategory() == null || !categoryIds.contains(product.getCategory().getId()))) {
                continue;
            }
            double score = score(product, tokens, normalize(query));
            if (score > 0 || tokens.isEmpty()) {
                matches.add(new Scored(product, score));
            }
        }
        matches.sort(Comparator.comparingDouble(Scored::score).reversed()
                .thenComparing(s -> -s.product().getRatingAverage())
                .thenComparing(s -> s.product().getName(), String.CASE_INSENSITIVE_ORDER));

        int total = matches.size();
        int totalPages = (int) Math.ceil(total / (double) size);
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        List<Product> content = matches.subList(from, to).stream().map(Scored::product).toList();
        return new ProductPageResponse(content, page, size, totalPages, total, all.size());
    }

    /** Sugerencias para autocompletar: nombres de productos y categorias que contienen el texto. */
    @Transactional(readOnly = true)
    public List<Suggestion> suggestions(String query) {
        String q = normalize(query);
        if (q.length() < 2) {
            return List.of();
        }
        List<Suggestion> starts = new ArrayList<>();
        List<Suggestion> contains = new ArrayList<>();
        for (Category category : categoryRepository.findAll()) {
            String title = normalize(category.getTitle());
            if (title.contains(q)) {
                Suggestion s = new Suggestion("category", category.getId(), category.getTitle(), "Categoría");
                (startsWord(title, q) ? starts : contains).add(s);
            }
        }
        for (Product product : productRepository.findAll()) {
            String name = normalize(product.getName());
            if (name.contains(q)) {
                String detail = product.getLocation() != null ? product.getLocation()
                        : product.getCategory() != null ? product.getCategory().getTitle() : "Producto";
                Suggestion s = new Suggestion("product", product.getId(), product.getName(), detail);
                (startsWord(name, q) ? starts : contains).add(s);
            }
        }
        List<Suggestion> result = new ArrayList<>(starts);
        result.addAll(contains);
        return result.size() > MAX_SUGGESTIONS ? result.subList(0, MAX_SUGGESTIONS) : result;
    }

    static double score(Product product, List<String> tokens, String fullQuery) {
        if (tokens.isEmpty()) {
            return 0;
        }
        String name = normalize(product.getName());
        String category = product.getCategory() != null ? normalize(product.getCategory().getTitle()) : "";
        String description = normalize(product.getDescription());
        String location = normalize(product.getLocation());
        double total = 0;
        for (String token : tokens) {
            double best = 0;
            if (startsWord(name, token)) {
                best = 3;
            } else if (name.contains(token)) {
                best = 2;
            }
            if (category.contains(token) || location.contains(token)) {
                best = Math.max(best, 2);
            }
            if (description.contains(token)) {
                best = Math.max(best, 1);
            }
            if (best == 0) {
                return 0; // todas las palabras deben coincidir
            }
            total += best;
        }
        if (tokens.size() > 1 && name.contains(fullQuery)) {
            total += 5;
        }
        return total;
    }

    private static void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if ((checkIn == null) != (checkOut == null)) {
            throw new IllegalArgumentException("Debes indicar la fecha de entrada y la de salida");
        }
        if (checkIn != null && !checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("La fecha de salida debe ser posterior a la de entrada");
        }
    }

    static List<String> tokenize(String query) {
        String q = normalize(query);
        if (q.isEmpty()) {
            return List.of();
        }
        return Arrays.stream(q.split("\\s+")).filter(t -> t.length() > 0).toList();
    }

    private static boolean startsWord(String text, String token) {
        return text.startsWith(token) || text.contains(" " + token);
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String n = Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return n.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9ñ ]", " ").replaceAll("\\s+", " ").trim();
    }

    private record Scored(Product product, double score) {
    }
}
