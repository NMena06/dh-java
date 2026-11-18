package com.reservaya.service;

import com.reservaya.exception.ResourceNotFoundException;
import com.reservaya.model.Favorite;
import com.reservaya.model.Product;
import com.reservaya.model.User;
import com.reservaya.repository.FavoriteRepository;
import com.reservaya.repository.ProductRepository;
import com.reservaya.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Historias #24 y #25: marcar, desmarcar y listar favoritos del usuario autenticado. */
@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository) {
        this.favoriteRepository = favoriteRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    /** Productos favoritos, el ultimo marcado primero. */
    @Transactional(readOnly = true)
    public List<Product> list(User user) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(Favorite::getProduct)
                .toList();
    }

    /** Idempotente: marcar dos veces no duplica. */
    @Transactional
    public Product add(User user, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con id " + productId));
        if (favoriteRepository.findByUserIdAndProductId(user.getId(), productId).isEmpty()) {
            favoriteRepository.save(new Favorite(userRepository.getReferenceById(user.getId()), product));
        }
        return product;
    }

    /** Idempotente: desmarcar un producto que no era favorito no falla. */
    @Transactional
    public void remove(User user, Long productId) {
        favoriteRepository.findByUserIdAndProductId(user.getId(), productId).ifPresent(favoriteRepository::delete);
    }
}
