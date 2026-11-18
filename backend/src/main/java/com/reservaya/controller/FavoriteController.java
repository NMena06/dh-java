package com.reservaya.controller;

import com.reservaya.model.Product;
import com.reservaya.model.User;
import com.reservaya.service.FavoriteService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Favoritos del usuario autenticado (historias #24 y #25). */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<Product> list(@AuthenticationPrincipal User user) {
        return favoriteService.list(user);
    }

    @PutMapping("/{productId}")
    public Product add(@AuthenticationPrincipal User user, @PathVariable Long productId) {
        return favoriteService.add(user, productId);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal User user, @PathVariable Long productId) {
        favoriteService.remove(user, productId);
    }
}
